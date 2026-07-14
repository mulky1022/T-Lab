<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\Otp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $user = User::where('email', mb_strtolower($request->email))->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if ($user->status !== 'Active') {
            return response()->json(['message' => 'Account is inactive.'], 403);
        }

        if (! $user->email_verified_at) {
            return response()->json(['message' => 'Please verify your email first.'], 403);
        }

        $ttl = $request->boolean('remember_me') ? config('jwt.remember_ttl') : config('jwt.ttl');
        JWTAuth::factory()->setTTL($ttl);
        $token = JWTAuth::fromUser($user);
        JWTAuth::factory()->setTTL(config('jwt.ttl'));

        return response()->json([
            'message' => 'Signed in successfully.',
            'token' => $token,
            'user' => $user->only(['id', 'name', 'email', 'role', 'status']),
        ]);
    }

    public function requestOtp(RegisterOtpRequest $request)
    {
        if ($request->role === 'Administrator') {
            throw ValidationException::withMessages([
                'role' => ['Only Project Manager and Team Member roles can register.'],
            ]);
        }

        $email = mb_strtolower(trim($request->email));
        $exists = User::where('email', $email)->exists();
        if ($exists) {
            throw ValidationException::withMessages([
                'email' => ['An account with this email already exists.'],
            ]);
        }

        $otp = $this->generateOtp($email, 'registration');
        $this->sendOtpEmail($email, $otp, 'registration');

        return response()->json([
            'message' => 'OTP sent to your email.',
            'email' => $email,
        ]);
    }

    public function verifyOtp(VerifyOtpRequest $request)
    {
        $otpRecord = Otp::where('email', mb_strtolower($request->email))
            ->where('type', $request->type)
            ->where('status', 'pending')
            ->latest('expires_at')
            ->first();

        if (! $otpRecord || $otpRecord->expires_at->isPast()) {
            return response()->json(['message' => 'OTP expired or invalid.'], 410);
        }

        if ($otpRecord->attempts >= 5) {
            return response()->json(['message' => 'Too many verification attempts.'], 429);
        }

        if (! Hash::check((string) $request->code, $otpRecord->code_hash)) {
            $otpRecord->attempts += 1;
            $otpRecord->save();
            return response()->json(['message' => 'Invalid OTP.'], 422);
        }

        $otpRecord->status = 'verified';
        $otpRecord->used_at = now();
        $otpRecord->save();

        return response()->json(['message' => 'OTP verified successfully.']);
    }

    public function register(RegisterRequest $request)
    {
        $email = mb_strtolower(trim($request->email));
        $verifiedOtp = Otp::where('email', $email)
            ->where('type', 'registration')
            ->where('status', 'verified')
            ->latest('used_at')
            ->first();

        if (! $verifiedOtp) {
            return response()->json(['message' => 'OTP verification is required before account creation.'], 403);
        }

        if (User::where('email', $email)->exists()) {
            return response()->json(['message' => 'An account with this email already exists.'], 409);
        }

        $user = User::create([
            'name' => trim($request->name),
            'email' => $email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $verifiedOtp->delete();

        return response()->json([
            'message' => 'Account created successfully.',
            'user' => $user->only(['id', 'name', 'email', 'role', 'status']),
        ], 201);
    }

    public function logout(Request $request)
    {
        try {
            JWTAuth::parseToken()->invalidate();
        } catch (\Throwable $exception) {
            // ignore invalidation failures and still clear the session
        }

        return response()->json(['message' => 'Signed out successfully.']);
    }

    public function me(Request $request)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json(['user' => $user?->only(['id', 'name', 'email', 'role', 'status'])]);
    }

    public function requestForgotOtp(ForgotPasswordRequest $request)
    {
        $email = mb_strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

        if ($user && (! $user->email_verified_at || $user->status !== 'Active')) {
            return response()->json(['message' => 'If an account with this email exists, a verification code has been sent.']);
        }

        if ($user) {
            $otp = $this->generateOtp($email, 'password_reset');
            $this->sendOtpEmail($email, $otp, 'password_reset');
        }

        return response()->json(['message' => 'If an account with this email exists, a verification code has been sent.']);
    }

    public function verifyForgotOtp(VerifyOtpRequest $request)
    {
        $request->merge(['type' => 'password_reset']);
        return $this->verifyOtp($request);
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        $email = mb_strtolower(trim($request->email));
        $otpRecord = Otp::where('email', $email)
            ->where('type', 'password_reset')
            ->where('status', 'verified')
            ->latest('used_at')
            ->first();

        if (! $otpRecord) {
            return response()->json(['message' => 'Password reset verification is required.'], 403);
        }

        $user = User::where('email', $email)->first();
        if (! $user) {
            return response()->json(['message' => 'We could not find an account for this email.'], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        $otpRecord->delete();
        Log::info('Password reset completed', ['email' => $email]);

        return response()->json(['message' => 'Password reset successfully.']);
    }

    protected function generateOtp(string $email, string $type): string
    {
        Otp::where('email', $email)->where('type', $type)->delete();

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        Otp::create([
            'email' => $email,
            'type' => $type,
            'code_hash' => Hash::make($code),
            'payload' => ['created_via' => 'resend'],
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
            'resend_count' => 0,
            'status' => 'pending',
        ]);

        return $code;
    }

    protected function sendOtpEmail(string $email, string $otp, string $type): void
    {
        $subject = $type === 'password_reset' ? 'Password Reset Verification' : 'Account Verification';
        $message = "Your verification code is {$otp}";
        Mail::to($email)->send(new \App\Mail\OtpMail($subject, $message));
    }
}
