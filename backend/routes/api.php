<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/register/request-otp', [AuthController::class, 'requestOtp'])->middleware('throttle:5,1');
Route::post('/register/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:10,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/logout', [AuthController::class, 'logout'])->middleware(['auth:sanctum', 'throttle:10,1']);
Route::get('/me', [AuthController::class, 'me'])->middleware(['auth:sanctum']);
Route::post('/forgot-password/request-otp', [AuthController::class, 'requestForgotOtp'])->middleware('throttle:5,1');
Route::post('/forgot-password/verify-otp', [AuthController::class, 'verifyForgotOtp'])->middleware('throttle:10,1');
Route::post('/forgot-password/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
Route::post('/forgot-password/resend-otp', [AuthController::class, 'requestForgotOtp'])->middleware('throttle:3,1');
