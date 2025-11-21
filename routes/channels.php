<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('message.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('group.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('online', function ($user) {
    return $user->toArray();
});

Broadcast::channel('group_online.{groupId}', function ($user, $groupId) {
    $group = \App\Models\Group::find($groupId);
    if ($group) {
        // Convert comma-separated string to array
        $memberIds = explode(',', $group->member_ids);
        // Check if user is a member (including owner)
        if (in_array($user->id, $memberIds) || $group->owner_id == $user->id) {
            // Return user data to allow joining the presence channel
            // The frontend will filter out the authenticated user
            return $user->toArray();
        }
    }
    return false;
});
