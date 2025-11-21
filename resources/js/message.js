const selectedContact = $('meta[name="selected_contact"]');
const selectedContactType = $('meta[name="selected_contact_type"]');
const baseUrl = $('meta[name="base_url"]').attr('content');
const inbox = $('.messages ul');
const message = $('.message');
const authId = $('meta[name="auth_id"]').attr('content');
let currentGroupChannel = null;
let groupChannels = {}; // Track all group channels
let groupOnlineCounts = {}; // Track online user count per group
let onlineUsers = []; // Track all online users from the general online channel

function toggleLoader(){
    $('.loader').toggleClass('d-none');
}

function messageTemplate (data, type){
    return `
        <li  class="${type}">
            <img src="${baseUrl}/images/avatar.jpg" alt="avatar" />
            <p>${data}</p>
        </li>
    `;
}

function scrollToBottom(){
    $('.messages').stop().animate({
        scrollTop: $('.messages')[0].scrollHeight
    }, 500);
}

function fetchMessages(contactId, type){
    $.ajax({
        url: baseUrl + '/messages',
        method: 'GET',
        data: {
            contact_id: contactId,
            type: type || 'user'
        },
        beforeSend: function () {
            toggleLoader();
        },
        success: function(response) {
            // Handle the response to display messages
            setContact(response.contact, response.type);
            response.messages.forEach((message) => {
                console.log(message.from_id == authId)
                if(message.from_id != authId){
                    inbox.append(messageTemplate(message.message, 'sent'));
                }else {
                    inbox.append(messageTemplate(message.message, 'replies'));
                }
            })
            scrollToBottom();
        },
        error: function(error) {
            console.error('Error fetching messages:', error);
        },
        complete: function () {
            toggleLoader();
        }
    })
}

function fetchGroupMessages(contactId, type){
    $.ajax({
        url: baseUrl + '/group-messages',
        method: 'GET',
        data: {
            contact_id: contactId,
            type: type || 'user'
        },
        beforeSend: function () {
            toggleLoader();
        },
        success: function(response) {
            // Handle the response to display messages
            setContact(response.contact, response.type);
            response.messages.forEach((message) => {
                if(message.from_id != authId){
                    inbox.append(messageTemplate(message.message, 'sent'));
                }else {
                    inbox.append(messageTemplate(message.message, 'replies'));
                }
            })
            scrollToBottom();
        },
        error: function(error) {
            console.error('Error fetching messages:', error);
        },
        complete: function () {
            toggleLoader();
        }
    })
}

function setContact(contact, type){
    console.log(type, contact.members_names)
    if(type === 'group' && contact.members_names){
        // Display members' names as comma-separated for groups
        $('.contact-name').text(contact.members_names);
    } else {
        // Display contact name for users
        $('.contact-name').text(contact.name);
    }
}

function sendMessage(){
    const contactId = selectedContact.attr('content');
    const formData = $('.message-form').serialize();
    $.ajax({
        url: baseUrl + '/send-message',
        method: 'POST',
        data: formData + '&contact_id=' + contactId,
        beforeSend: function () {
            scrollToBottom();
        },
        success: function(response) {

        },
        error: function(error) {
            console.error('Error sending message:', error);
        }
    })
}

function sendGroupMessage(){
    const contactId = selectedContact.attr('content');
    const formData = $('.message-form').serialize();
    $.ajax({
        url: baseUrl + '/send-group-message',
        method: 'POST',
        data: formData + '&contact_id=' + contactId,
        beforeSend: function () {
            scrollToBottom();
        },
        success: function(response) {

        },
        error: function(error) {
            console.error('Error sending message:', error);
        }
    })
}

function joinGroupChannel(groupId) {
    if (groupId && !groupChannels[groupId]) {
        // Initialize online count for this group
        groupOnlineCounts[groupId] = 0;

        // Join the group_online channel for this group
        const channel = window.Echo.join(`group_online.${groupId}`)
            .subscribed(() => {
                console.log(`Subscribed to group_online.${groupId}`);
            })
            .here((users) => {
                console.log(`Group ${groupId} - Online users:`, users);
                // Filter out the authenticated user from the list (handle both string and number IDs)
                const otherUsers = users.filter(user => {
                    const userId = String(user.id);
                    const authUserId = String(authId);
                    return userId !== authUserId;
                });
                // Update the count and group status (excluding auth user)
                groupOnlineCounts[groupId] = otherUsers.length;
                // Use setTimeout to ensure DOM is ready, especially for newly created groups
                setTimeout(() => {
                    updateGroupStatus(groupId, otherUsers.length > 0);
                }, 100);
            })
            .joining((user) => {
                // Ignore if it's the authenticated user (handle both string and number IDs)
                const userId = String(user.id);
                const authUserId = String(authId);
                if (userId === authUserId) {
                    return;
                }
                console.log(`User ${user.name} joined group ${groupId}`);
                // Increment count and mark the group as active
                groupOnlineCounts[groupId] = (groupOnlineCounts[groupId] || 0) + 1;
                updateGroupStatus(groupId, true);
            })
            .leaving((user) => {
                // Ignore if it's the authenticated user (handle both string and number IDs)
                const userId = String(user.id);
                const authUserId = String(authId);
                if (userId === authUserId) {
                    return;
                }
                console.log(`User ${user.name} left group ${groupId}`);
                // Decrement count and update status
                groupOnlineCounts[groupId] = Math.max(0, (groupOnlineCounts[groupId] || 1) - 1);
                updateGroupStatus(groupId, groupOnlineCounts[groupId] > 0);
            })
            .error((error) => {
                console.error(`Error joining group_online.${groupId}:`, error);
            });

        groupChannels[groupId] = channel;
    }
}

function joinAllGroupChannels() {
    // Get all group IDs from the page
    const groupContacts = $('.contact[data-type="group"]');

    groupContacts.each(function() {
        const groupId = $(this).data('id');
        joinGroupChannel(groupId);
    });
}

function updateGroupStatus(groupId, hasOnlineUsers) {
    // Convert groupId to string for comparison
    const groupIdStr = String(groupId);
    const groupContact = $(`.contact[data-id='${groupIdStr}'][data-type='group']`);
    
    if (groupContact.length === 0) {
        console.warn(`Group contact not found for group ID: ${groupIdStr}`);
        return;
    }
    
    const statusElement = groupContact.find('.contact-status');

    if (hasOnlineUsers) {
        statusElement.removeClass('offline').addClass('online');
        console.log(`Group ${groupIdStr} status updated to: online`);
    } else {
        statusElement.removeClass('online').addClass('offline');
        console.log(`Group ${groupIdStr} status updated to: offline`);
    }
}

function addContactIfNotExists(user) {
    // Check if user already exists in contact list
    const userIdStr = String(user.id);
    const existingContact = $(`.contact[data-id='${userIdStr}'][data-type='user']`);
    
    if (existingContact.length > 0) {
        console.log('Contact already exists in list');
        return;
    }
    
    // Find the Friends section ul element (first ul after "Friends" div)
    // The structure is: #contacts > div.mt-3.ms-3 (Friends) > ul
    let friendsList = null;
    $('#contacts > div.mt-3.ms-3').each(function() {
        if ($(this).text().trim() === 'Friends') {
            friendsList = $(this).next('ul');
            return false; // break the loop
        }
    });
    
    // Fallback: if not found by text, use first ul
    if (!friendsList || friendsList.length === 0) {
        friendsList = $('#contacts > ul').first();
    }
    
    // If "No friends found." message exists, remove it
    friendsList.find('p.text-center').remove();
    
    // Check if user is currently online
    const userIsOnline = onlineUsers && onlineUsers.some(onlineUser => {
        const onlineUserId = String(onlineUser.id);
        return onlineUserId === userIdStr;
    });
    
    const statusClass = userIsOnline ? 'online' : 'offline';
    
    // Create new contact element with appropriate status
    const imageUrl = baseUrl + '/images/avatar.jpg';
    const newContact = `
        <li class="contact" data-id="${user.id}" data-type="user">
            <div class="wrap">
                <span class="contact-status ${statusClass}"></span>
                <img src="${imageUrl}" alt="avatar" />
                <div class="meta">
                    <p class="name">${user.name}</p>
                </div>
            </div>
        </li>`;
    
    // Add the new contact to the list
    friendsList.append(newContact);
    console.log('New contact added to sidebar:', user.name, 'Status:', statusClass);
    
    // Also add the user to the group creation modal
    addUserToModal(user);
}

$(document).ready(function() {
    // Join all group channels on page load to show online status
    joinAllGroupChannels();

    // Use event delegation for dynamically added contacts
    $(document).on('click', '.contact', function() {
        const contactId = $(this).data('id');
        const contactType = $(this).data('type') || 'user';
        selectedContact.attr('content', contactId);
        selectedContactType.attr('content', contactType);
        $('.empty-box').addClass('d-none');
        inbox.empty();
        console.log(contactType)
        if(contactType === 'group'){
            fetchGroupMessages(contactId, contactType);
            // The group channel is already joined via joinAllGroupChannels()
            // We can use the existing channel for detailed updates
            currentGroupChannel = contactId;
            return;
        }
        // Leave detailed group channel if switching to user
        if (currentGroupChannel) {
            currentGroupChannel = null;
        }
        fetchMessages(contactId, contactType);
    })
    $('.message-form').on('submit', function(e) {
        e.preventDefault();
        console.log(selectedContactType.attr('content'))
        if(selectedContactType.attr('content') === 'group'){
            inbox.append(messageTemplate(message.val(), 'replies'));
            sendGroupMessage();
            message.val('');
            return;
        }
        inbox.append(messageTemplate(message.val(), 'replies'));
        sendMessage();
        message.val('');
    })
})

window.Echo.private('message.' + authId)
    .listen('SendMessageEvent', function (e){
        console.log(e);
        const contactId = selectedContact.attr('content');
        console.log(e.to_id,contactId)
        
        // Check if sender is in the contact list, if not, add them
        if (e.from_user) {
            addContactIfNotExists(e.from_user);
        }
        
        if(e.from_id == contactId){
            inbox.append(messageTemplate(e.text, 'sent'));
            scrollToBottom();
        }
    })

window.Echo.private('group.' + authId)
    .listen('SendGroupMessageEvent', function (e){
        console.log(e);
        const contactId = selectedContact.attr('content');
        if(e.group_id == contactId){
            inbox.append(messageTemplate(e.text, 'sent'));
            scrollToBottom();
        }
    })
    .listen('.GroupCreatedEvent', function (e){
        console.log('Group created event received:', e);
        console.log('Full event data:', JSON.stringify(e, null, 2));
        
        // Check if group data exists
        if (!e || !e.group) {
            console.error('Group data not found in event:', e);
            return;
        }
        
        const group = e.group;
        
        // Check if group already exists in the list
        const existingGroup = $(`.contact[data-id='${group.id}'][data-type='group']`);
        if (existingGroup.length > 0) {
            console.log('Group already exists in list');
            return;
        }
        
        // Add the new group to the groups list
        const imageUrl = baseUrl + '/images/avatar.jpg';
        const newGroup = `
            <li class="contact" data-id="${group.id}" data-type="group">
                <div class="wrap">
                    <span class="contact-status offline"></span>
                    <img src="${imageUrl}" alt="avatar" />
                    <div class="meta">
                        <p class="name">${group.title}</p>
                    </div>
                </div>
            </li>`;
        
        $('#groups').append(newGroup);
        
        // Check if any members are online and join the group channel
        const memberIds = group.member_ids ? group.member_ids.split(',').map(id => String(id.trim())) : [];
        const ownerId = String(group.owner_id);
        
        let hasOnlineMembers = false;
        if (onlineUsers && onlineUsers.length > 0) {
            hasOnlineMembers = onlineUsers.some(onlineUser => {
                const onlineUserId = String(onlineUser.id);
                const authUserId = String(authId);
                return (memberIds.includes(onlineUserId) || onlineUserId === ownerId) && onlineUserId !== authUserId;
            });
        }
        
        // Join the group_online channel for the new group
        setTimeout(() => {
            joinGroupChannel(group.id);
            
            // Set initial status based on online members check
            if (hasOnlineMembers) {
                updateGroupStatus(group.id, true);
                groupOnlineCounts[group.id] = 1;
            }
        }, 100);
    })

window.Echo.join('online')
    .here((users) => {
        console.log(users);
        // Store online users for checking group member status
        onlineUsers = users;
        users.forEach((user) => {
            $(`.contact[data-id='${user.id}']`).find('.contact-status').removeClass('offline').addClass('online');
            // $('#user-' + user.id).find('.status').addClass('online');
        })
    })
    .joining((user) => {
        console.log(user);
        // Add user to online users list
        if (!onlineUsers.find(u => u.id === user.id)) {
            onlineUsers.push(user);
        }
        $(`.contact[data-id='${user.id}']`).find('.contact-status').removeClass('offline').addClass('online');
    })
    .leaving((user) => {
        console.log(user);
        // Remove user from online users list
        onlineUsers = onlineUsers.filter(u => u.id !== user.id);
        $(`.contact[data-id='${user.id}']`).find('.contact-status').removeClass('online').addClass('offline');
    });


function addUserToModal(user) {
    // Check if user already exists in modal
    const userIdStr = String(user.id);
    const existingCheckbox = $(`#user_${userIdStr}`);
    
    if (existingCheckbox.length > 0) {
        console.log('User already exists in modal:', user.name);
        return;
    }
    
    // Find the modal member list container
    const memberListContainer = $('#groupModal .border.rounded.p-3');
    
    if (memberListContainer.length === 0) {
        console.warn('Modal member list container not found');
        return;
    }
    
    // Create new checkbox element for the user
    const newCheckbox = `
        <div class="form-check mb-2">
            <input class="form-check-input member-checkbox" type="checkbox" value="${user.id}" id="user_${user.id}">
            <label class="form-check-label" for="user_${user.id}">
                ${user.name}
            </label>
        </div>`;
    
    // Add the new checkbox to the modal
    memberListContainer.append(newCheckbox);
    
    // Attach event handler to the new checkbox
    const newCheckboxElement = $(`#user_${user.id}`);
    newCheckboxElement.on('change', function() {
        updateMemberIds();
    });
    
    console.log('User added to modal:', user.name);
}

function updateMemberIds() {
    const checkboxes = document.querySelectorAll('.member-checkbox');
    const memberIdsInput = document.getElementById('member_ids');
    
    if (!memberIdsInput) {
        return;
    }
    
    const selectedIds = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    memberIdsInput.value = selectedIds.join(',');
}

document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('.member-checkbox');
    const memberIdsInput = document.getElementById('member_ids');

    // Attach event handlers to existing checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateMemberIds);
    });

    // Reset checkboxes when modal is closed
    const groupModal = document.getElementById('groupModal');
    if (groupModal) {
        groupModal.addEventListener('hidden.bs.modal', function() {
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            if (memberIdsInput) {
                memberIdsInput.value = '';
            }
        });
    }
});


function createGroup(){
    const baseUrl = $('meta[name="base_url"]').attr('content');
    if (typeof jQuery === 'undefined' || typeof $ === 'undefined') {
        console.error('jQuery is not loaded');
        return;
    }

    const formData = $('#groupForm').serialize();
    $.ajax({
        url: baseUrl + '/create-group',
        method: 'POST',
        data: formData,
        beforeSend: function () {

        },
        success: function(response) {
            console.log(response);
            
            // Get member_ids BEFORE resetting the form
            const memberIdsInput = document.getElementById('member_ids');
            const memberIdsStr = memberIdsInput ? memberIdsInput.value : '';
            const memberIds = memberIdsStr ? memberIdsStr.split(',').map(id => String(id.trim())) : [];
            const ownerId = String(response.owner_id);
            
            // Close modal on success
            $('#groupModal').modal('hide');
            // Reset form
            $('#groupForm')[0].reset();
            $('#member_ids').val('');
            $('.member-checkbox').prop('checked', false);
            
            // Get base URL for image path
            const imageUrl = baseUrl + '/images/avatar.jpg';
            
            const newGroup = `
              <li class="contact" data-id="${response.id}" data-type="group">
                    <div class="wrap">
                        <span class="contact-status offline"></span>
                        <img src="${imageUrl}" alt="avatar" />
                        <div class="meta">
                            <p class="name">${response.title}</p>
                        </div>
                    </div>
                </li>`;
            $('#groups').append(newGroup);
            
            // Check if any group members are currently online
            
            // Check if any members (excluding the creator) are online
            let hasOnlineMembers = false;
            if (onlineUsers && onlineUsers.length > 0) {
                hasOnlineMembers = onlineUsers.some(onlineUser => {
                    const onlineUserId = String(onlineUser.id);
                    const authUserId = String(authId);
                    // Check if this online user is a member or owner, but not the creator
                    return (memberIds.includes(onlineUserId) || onlineUserId === ownerId) && onlineUserId !== authUserId;
                });
            }
            
            // Join the group_online channel for the new group to track online status
            // Use a small delay to ensure DOM is ready
            setTimeout(() => {
                joinGroupChannel(response.id);
                
                // Set initial status based on online members check
                if (hasOnlineMembers) {
                    // Update status immediately if members are online
                    updateGroupStatus(response.id, true);
                    groupOnlineCounts[response.id] = 1; // At least one is online
                }
                
                // Also check status after a short delay to catch any users who join shortly after
                // This handles the case where members join the group channel after group creation
                setTimeout(() => {
                    const currentCount = groupOnlineCounts[response.id] || 0;
                    // Only update if we have a confirmed count, otherwise keep the initial status
                    if (currentCount > 0 || hasOnlineMembers) {
                        updateGroupStatus(response.id, currentCount > 0 || hasOnlineMembers);
                    }
                }, 500);
            }, 50);
            
            console.log(response)
        },
        error: function(error) {
            console.error('Error creating group:', error);
        }
    })
}

// Handle form submission via button click and form submit
(function() {
    function handleGroupSubmit(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
        createGroup();
        return false;
    }

    // Attach handlers when DOM is ready
    function attachHandlers() {
        // Button click handler
        const saveBtn = document.getElementById('saveGroupBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', handleGroupSubmit);
        }

        // Form submit handler (backup)
        const groupForm = document.getElementById('groupForm');
        if (groupForm) {
            groupForm.addEventListener('submit', handleGroupSubmit, true);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachHandlers);
    } else {
        attachHandlers();
    }

    // Also use event delegation on document as backup
    document.addEventListener('submit', function(e) {
        if (e.target && e.target.id === 'groupForm') {
            handleGroupSubmit(e);
        }
    }, true);

    // Button click delegation
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'saveGroupBtn') {
            handleGroupSubmit(e);
        }
    });
})();

// jQuery handler (backup)
if (typeof jQuery !== 'undefined') {
    $(document).ready(function() {
        $('#saveGroupBtn').on('click', function(e) {
            e.preventDefault();
            createGroup();
        });

        $(document).on('submit', '#groupForm', function(e) {
            e.preventDefault();
            e.stopPropagation();
            createGroup();
            return false;
        });
    });
}
