<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_registration_is_rejected(): void
    {
        $response = $this->postJson('/api/register/request-otp', [
            'name' => 'Admin Test',
            'email' => 'admin.test@example.com',
            'password' => 'StrongPass1!',
            'password_confirmation' => 'StrongPass1!',
            'role' => 'Administrator',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Only Project Manager and Team Member roles can register.');
    }

    public function test_user_can_login_with_verified_account(): void
    {
        $user = User::factory()->create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Project Manager',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'jane@example.com',
            'password' => 'StrongPass1!',
            'role' => 'Project Manager',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['message', 'token', 'user']);
        $this->assertSame($user->email, $response->json('user.email'));
    }

    public function test_login_issues_a_jwt_with_the_user_role_claim_for_each_role(): void
    {
        foreach (['Administrator', 'Project Manager', 'Team Member'] as $role) {
            $user = User::factory()->create([
                'name' => "$role User",
                'email' => strtolower(str_replace(' ', '.', $role)) . '@example.com',
                'password' => Hash::make('StrongPass1!'),
                'role' => $role,
                'status' => 'Active',
                'email_verified_at' => now(),
            ]);

            $response = $this->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'StrongPass1!',
            ]);

            $response->assertStatus(200)
                ->assertJsonPath('user.role', $role);

            $payload = JWTAuth::setToken($response->json('token'))->getPayload();
            $this->assertSame($role, $payload->get('role'));
        }
    }

    public function test_role_specific_routes_reject_wrong_roles(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin.role@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Administrator',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $manager = User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager.role@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Project Manager',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $member = User::factory()->create([
            'name' => 'Member User',
            'email' => 'member.role@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Team Member',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $this->withAuthenticatedUser($admin)->getJson('/api/users')->assertStatus(200);
        $this->withAuthenticatedUser($manager)->getJson('/api/users')->assertStatus(403);
        $this->withAuthenticatedUser($member)->getJson('/api/users')->assertStatus(403);

        $this->withAuthenticatedUser($admin)->getJson('/api/projects')->assertStatus(200);
        $this->withAuthenticatedUser($manager)->getJson('/api/projects')->assertStatus(200);
        $this->withAuthenticatedUser($member)->getJson('/api/projects')->assertStatus(403);
    }

    public function test_forgot_password_request_returns_success_message(): void
    {
        $response = $this->postJson('/api/forgot-password/request-otp', [
            'email' => 'reset@example.com',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'If an account with this email exists, a verification code has been sent.');
    }

    private function withAuthenticatedUser(User $user)
    {
        $token = JWTAuth::fromUser($user);

        return $this->withHeader('Authorization', 'Bearer ' . $token);
    }
}
