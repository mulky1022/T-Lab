<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\UserController;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/register/request-otp', [AuthController::class, 'requestOtp'])->middleware('throttle:5,1');
Route::post('/register/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:10,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/logout', [AuthController::class, 'logout'])->middleware(['jwt.auth', 'throttle:10,1']);
Route::get('/me', [AuthController::class, 'me'])->middleware(['jwt.auth']);
Route::post('/forgot-password/request-otp', [AuthController::class, 'requestForgotOtp'])->middleware('throttle:5,1');
Route::post('/forgot-password/verify-otp', [AuthController::class, 'verifyForgotOtp'])->middleware('throttle:10,1');
Route::post('/forgot-password/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
Route::post('/forgot-password/resend-otp', [AuthController::class, 'requestForgotOtp'])->middleware('throttle:3,1');

Route::middleware(['jwt.auth'])->group(function () {
    Route::apiResource('projects', ProjectController::class);
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('users', UserController::class);
    Route::post('comments', [CommentController::class, 'store']);
    Route::put('comments/{id}', [CommentController::class, 'update']);
    Route::delete('comments/{id}', [CommentController::class, 'destroy']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::get('audit-logs', [AuditLogController::class, 'index']);
});
