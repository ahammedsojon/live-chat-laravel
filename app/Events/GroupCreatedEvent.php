<?php

namespace App\Events;

use App\Models\Group;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GroupCreatedEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public $group;
    private $groupModel;
    private $creatorId;

    public function __construct(Group $group, $creatorId = null)
    {
        // Reload the group to ensure fresh data
        $this->groupModel = $group->fresh();
        $this->creatorId = $creatorId ?? $group->owner_id;
        // Convert group to array with all necessary fields for frontend
        $this->group = [
            'id' => $this->groupModel->id,
            'title' => $this->groupModel->title,
            'owner_id' => $this->groupModel->owner_id,
            'member_ids' => $this->groupModel->member_ids,
            'image' => $this->groupModel->image,
            'created_at' => $this->groupModel->created_at ? $this->groupModel->created_at->toDateTimeString() : null,
            'updated_at' => $this->groupModel->updated_at ? $this->groupModel->updated_at->toDateTimeString() : null,
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [];
        
        // Get all member IDs and owner ID from the model
        $memberIds = [];
        if (!empty($this->groupModel->member_ids)) {
            $memberIds = explode(',', $this->groupModel->member_ids);
            $memberIds = array_map('trim', $memberIds);
        }
        
        // Add owner to the list
        $allMemberIds = array_merge($memberIds, [$this->groupModel->owner_id]);
        $allMemberIds = array_unique($allMemberIds);
        
        // Exclude the creator from receiving the broadcast (they already have it from AJAX response)
        $allMemberIds = array_filter($allMemberIds, function($memberId) {
            return (int)$memberId !== (int)$this->creatorId;
        });
        
        // Broadcast to private channel for each member (excluding creator)
        foreach ($allMemberIds as $memberId) {
            $channels[] = new PrivateChannel('group.' . $memberId);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     *
     * @return string
     */
    public function broadcastAs()
    {
        return 'GroupCreatedEvent';
    }
}

