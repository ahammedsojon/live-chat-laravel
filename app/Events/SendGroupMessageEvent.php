<?php

namespace App\Events;

use App\Models\Group;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SendGroupMessageEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public $text, $from_id, $group_id;

    public function __construct(string $text, int $from_id, int $group_id)
    {
        $this->text = $text;
        $this->from_id = $from_id;
        $this->group_id = $group_id;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [];

        $group = Group::find($this->group_id);

        // Get members + owner and exclude current sender
        $members = collect($group->members()->pluck('id')->toArray())
            ->push($group->owner_id)
            ->unique()
            ->filter(fn ($memberId) => $memberId !== $this->from_id);

        // Add private channel for each receiver
        foreach ($members as $memberId) {
            $channels[] = new PrivateChannel('group.' . $memberId); // keep message. if used earlier
            // or use 'group.' if frontend is listening there
        }

        return $channels;
    }

}
