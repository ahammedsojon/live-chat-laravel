<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', [ChatController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/messages', [ChatController::class, 'getMessages'])->name('get-messages');
Route::post('/send-message', [ChatController::class, 'sendMessage'])->name('send-message');
Route::get('/group-messages', [GroupController::class, 'getGroupMessages'])->name('get-group-messages');
Route::post('/create-group', [GroupController::class, 'createGroup'])->name('create-group');
Route::post('/send-group-message', [GroupController::class, 'sendGroupMessage'])->name('send-group-message');

require __DIR__.'/auth.php';
