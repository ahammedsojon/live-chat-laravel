<x-app-layout>
    <div id="frame">
        @include('layouts.sidebar')
        <div class="content">
            <div class="loader d-none">
                <div class="loader-inner">
                    <l-dot-spinner
                        size="40"
                        speed="0.9"
                        color="black"
                    ></l-dot-spinner>
                </div>
            </div>
            <div class="empty-box">
                <div class="empty-inner">Select a contact to send message.</div>
            </div>
            <div class="contact-profile">
                <img src="{{asset('/images/avatar.jpg')}}" alt="avatar" />
                <p class="contact-name"></p>
                <div class="social-media">

                </div>
            </div>
            <div class="messages">
                <ul>
{{--                    dynamic content will fetch here--}}
                </ul>
            </div>
            <form class="message-form">
                @csrf
                <div class="message-input">
                    <div class="wrap">
                        <input type="text" placeholder="Write your message..." name="message" class="message" />
                        <button type="submit" class="submit"><i class="fa fa-paper-plane" aria-hidden="true"></i></button>
                    </div>
                </div>
            </form>
        </div>
    </div>
    <x-slot name="scripts">
        @vite(['resources/js/app.js', 'resources/js/echo.js', 'resources/js/message.js'])
    </x-slot>
</x-app-layout>
