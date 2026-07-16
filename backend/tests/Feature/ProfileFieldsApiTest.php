<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ProfileFieldsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_endpoint_returns_phone_and_department_for_authenticated_user(): void
    {
        $user = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin.profile@example.com',
            'password' => Hash::make('password'),
            'role' => 'Administrator',
            'status' => 'Active',
            'phone' => '+94770000000',
            'department' => 'Engineering',
            'email_verified_at' => now(),
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me');

        $response->assertOk()
            ->assertJsonPath('user.phone', '+94770000000')
            ->assertJsonPath('user.department', 'Engineering');
    }

    public function test_admin_can_update_phone_and_department(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin Update',
            'email' => 'admin.update@example.com',
            'password' => Hash::make('password'),
            'role' => 'Administrator',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/users/' . $admin->id, [
                'phone' => '+94770000001',
                'department' => 'Product',
            ]);

        $response->assertOk()
            ->assertJsonPath('phone', '+94770000001')
            ->assertJsonPath('department', 'Product');

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'phone' => '+94770000001',
            'department' => 'Product',
        ]);
    }
}
