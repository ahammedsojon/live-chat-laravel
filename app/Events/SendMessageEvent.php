<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SendMessageEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public $text;
    public $from_id;
    public $to_id;
    public $from_user;

    public function __construct(string $text, int $from_id, int $to_id)
    {
        $this->text = $text;
        $this->from_id = $from_id;
        $this->to_id = $to_id;
        
        // Include sender user data for adding to sidebar
        $fromUser = User::find($from_id);
        $this->from_user = $fromUser ? [
            'id' => $fromUser->id,
            'name' => $fromUser->name,
            'email' => $fromUser->email,
        ] : null;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('message.' . $this->to_id),
        ];
    }
}
