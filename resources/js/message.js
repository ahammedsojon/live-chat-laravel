const selectedContact = $('meta[name="selected_contact"]');
const baseUrl = $('meta[name="base_url"]').attr('content');
const inbox = $('.messages ul');
const message = $('.message');
const authId = $('meta[name="auth_id"]').attr('content');

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

function fetchMessages(contactId){
    $.ajax({
        url: baseUrl + '/messages',
        method: 'GET',
        data: {
            contact_id: contactId
        },
        beforeSend: function () {
            toggleLoader();
        },
        success: function(response) {
            // Handle the response to display messages
            setContact(response.contact);
            response.messages.forEach((message) => {
                if(message.from_id === response.contact.id){
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

function setContact(contact){
    $('.contact-name').text(contact.name);
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

$(document).ready(function() {
    $('.contact').on('click', function() {
        const contactId = $(this).data('id');
        selectedContact.attr('content', contactId);
        $('.empty-box').addClass('d-none');
        inbox.empty();
        fetchMessages(contactId);
    })
    $('.message-form').on('submit', function(e) {
        e.preventDefault();
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
        if(e.from_id == contactId){
            inbox.append(messageTemplate(e.text, 'sent'));
            scrollToBottom();
        }
    })

window.Echo.join('online')
    .here((users) => {
        console.log(users);
        users.forEach((user) => {
            $(`.contact[data-id='${user.id}']`).find('.contact-status').removeClass('offline').addClass('online');
            // $('#user-' + user.id).find('.status').addClass('online');
        })
    })
    .joining((user) => {
        console.log(user);
        $(`.contact[data-id='${user.id}']`).find('.contact-status').removeClass('offline').addClass('online');
    })
    .leaving((user) => {
        console.log(user);
        $(`.contact[data-id='${user.id}']`).find('.contact-status').removeClass('online').addClass('offline');
    });
