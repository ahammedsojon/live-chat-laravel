<?php

namespace App\Http\Controllers;

use App\Events\SendMessageEvent;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index()
    {
        $users = User::where('id', '!=', auth()->id())->get();
        return view('dashboard', compact('users'));
    }

    public function getMessages(Request $request)
    {
        $contact = User::findOrFail($request->get('contact_id'));
        $messages = Message::where('from_id', auth()->id())->where('to_id', $request->contact_id)
                    ->orWhere('from_id', $request->contact_id)->where('to_id', auth()->id())->orderBy('id', 'asc')->get();
        return response()->json([
            'contact' => $contact,
            'messages' => $messages
        ]);
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'contact_id' => 'required',
            'message' => ['required', 'string']
        ]);
        $message = new \App\Models\Message();
        $message->from_id = auth()->id();
        $message->to_id = $request->contact_id;
        $message->message = $request->message;
        $message->save();
        event(new SendMessageEvent($message->message, auth()->id(), $request->contact_id));
        return response($message);
    }
}
