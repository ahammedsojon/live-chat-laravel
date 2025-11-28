<div id="sidepanel">
    <div id="profile">
        <div class="wrap">
            <img id="profile-img" src="{{asset('/images/avatar.jpg')}}" class="online" alt="avatar" />
            <p>{{auth()->user()->name}}</p>
            <i class="fa fa-chevron-down expand-button" aria-hidden="true"></i>
            <div id="status-options">
                <ul>
                    <li id="status-online" class="active"><span class="status-circle"></span>
                        <p>Online</p>
                    </li>
                    <li id="status-away"><span class="status-circle"></span>
                        <p>Away</p>
                    </li>
                    <li id="status-busy"><span class="status-circle"></span>
                        <p>Busy</p>
                    </li>
                    <li id="status-offline"><span class="status-circle"></span>
                        <p>Offline</p>
                    </li>
                </ul>
            </div>

        </div>
    </div>
    <hr>
    <div id="contacts">
        <div class="mt-3 ms-3">Friends</div>
        <ul>
            @forelse($users as $user)
                <li class="contact" data-id="{{$user->id}}" data-type="user">
                    <div class="wrap">
                        <span class="contact-status offline"></span>
                        <img src="{{asset('/images/avatar.jpg')}}" alt="avatar" />
                        <div class="meta">
                            <p class="name">{{$user->name}}</p>
                        </div>
                    </div>
                </li>
            @empty
                <p class="text-center">No friends found.</p>
            @endforelse
        </ul>
        <div class="mt-3 ms-3">Groups</div>
        <ul id="groups">
            @forelse($groups ?? [] as $group)
                <li class="contact" data-id="{{$group->id}}" data-type="group">
                    <div class="wrap">
                        <span class="contact-status offline"></span>
                        <img src="{{asset('/images/avatar.jpg')}}" alt="avatar" />
                        <div class="meta">
                            <p class="name">{{$group->title}}</p>
                        </div>
                    </div>
                </li>
            @empty
                <p class="text-center">No groups found.</p>
            @endforelse
        </ul>
    </div>
    <div class="flex items-center justify-between px-3">
        <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#groupModal">Create Group</button>
        <form action="{{route('logout')}}" method="POST" class="text-center">
            @csrf
            <button type="submit" class="btn btn-danger">Logout</button>
        </form>
    </div>
</div>

<!-- Modal -->
<div class="modal fade" id="groupModal" tabindex="-1" aria-labelledby="groupModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="groupModalLabel">Create Group</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form class="group-form" id="groupForm">
                @csrf
                <div class="modal-body">
                    <div class="form-group mb-3">
                        <input type="text" name="title" class="form-control" placeholder="Group Name">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Select Members</label>
                        <div class="border rounded p-3" style="max-height: 200px; overflow-y: auto;">
                            @foreach($users as $user)
                                <div class="form-check mb-2">
                                    <input class="form-check-input member-checkbox" type="checkbox" value="{{$user->id}}" id="user_{{$user->id}}">
                                    <label class="form-check-label" for="user_{{$user->id}}">
                                        {{$user->name}}
                                    </label>
                                </div>
                            @endforeach
                        </div>
                        <input type="hidden" name="member_ids" id="member_ids" value="">
                    </div>
                    <div class="mb-3">
                        <textarea name="message" id="message" rows="5" class="form-control"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" id="saveGroupBtn">Save</button>
                </div>

            </form>
        </div>
    </div>
</div>

<script>

</script>
