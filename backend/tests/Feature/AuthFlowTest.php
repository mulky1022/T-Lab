<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

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
}
