<?php

namespace App\Http\Controllers;

use App\Events\GroupCreatedEvent;
use App\Events\SendGroupMessageEvent;
use App\Events\SendMessageEvent;
use App\Models\Group;
use App\Models\GroupMessage;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;

class GroupController extends Controller
{


    public function createGroup(Request $request)
    {
        $request->validate([
            'title' => 'required',
            'member_ids' => 'required',
            'image' => 'nullable',
            'message' => 'nullable',
        ]);

        $group = new \App\Models\Group();
        $group->title = $request->title;
        $group->owner_id = auth()->id();
        $group->member_ids = $request->member_ids;
        $group->image = $request->image;
        $group->save();
        
        // Broadcast group created event to all members (excluding the creator)
        event(new GroupCreatedEvent($group, auth()->id()));
        
        // If message exists, send it to all group members
        if($request->message){
            $message = new GroupMessage();
            $message->from_id = auth()->id();
            $message->message = $request->message;
            $message->group_id = $group->id;
            $message->save();
        }

        return response($group);
    }



    public function getGroupMessages(Request $request)
    {
        $authId = auth()->id();
        $contact = Group::findOrFail($request->get('contact_id'));

        $members = $contact->members()->get(); // member collection
        $owner = $contact->owner; // owner model

        // Remove current auth user from members list
        $filteredMembers = $members->filter(function ($member) use ($authId) {
            return $member->id !== $authId;
        });

        // If owner is not the auth user, add owner name
        if ($owner->id !== $authId) {
            $filteredMembers->push($owner);
        }

        $contact->members_names = $filteredMembers->pluck('name')->implode(', ');
        $contact->type = 'group';

        $messages = GroupMessage::where('group_id', $contact->id)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'contact' => $contact,
            'messages' => $messages,
            'type' => $request->get('type', 'group')
        ]);
    }


    public function sendGroupMessage(Request $request)
    {
        $request->validate([
            'contact_id' => 'required',
            'message' => ['required', 'string']
        ]);
        $message = new \App\Models\GroupMessage();
        $message->from_id = auth()->id();
        $message->group_id = $request->contact_id;
        $message->message = $request->message;
        $message->save();
        event(new SendGroupMessageEvent($message->message, auth()->id(), $request->contact_id));
        return response($message);
    }
}
