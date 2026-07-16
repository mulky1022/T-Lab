<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AiAssistantChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_chatbot_receives_all_projects_and_tasks(): void
    {
        Http::fake([
            'https://openrouter.ai/api/v1/chat/completions' => Http::response([
                'choices' => [[
                    'message' => ['content' => 'Admin context ok'],
                ]],
            ], 200),
        ]);

        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin.assistant@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Administrator',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $manager = User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager.assistant@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Project Manager',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $member = User::factory()->create([
            'name' => 'Member User',
            'email' => 'member.assistant@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Team Member',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $project = Project::create([
            'name' => 'Alpha Project',
            'description' => 'Visible to admin',
            'manager_id' => $manager->id,
            'member_ids' => [$member->id],
            'budget' => '1000',
            'status' => 'Active',
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-31',
        ]);

        Task::create([
            'project_id' => $project->id,
            'title' => 'Alpha task',
            'description' => 'Admin should see it',
            'assignee_id' => $member->id,
            'status' => 'Todo',
            'priority' => 2,
            'due_date' => '2026-07-10',
        ]);

        $response = $this->withAuthenticatedUser($admin)->postJson('/api/ai-assistant/chat', [
            'message' => 'Summarize my projects',
        ]);

        $response->assertStatus(200);
        $this->assertSame('Admin context ok', $response->json('reply'));
        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true, 512, JSON_THROW_ON_ERROR);
            return str_contains($body['messages'][0]['content'], 'Alpha Project');
        });
    }

    public function test_team_member_chatbot_only_receives_assigned_project_context(): void
    {
        Http::fake([
            'https://openrouter.ai/api/v1/chat/completions' => Http::response([
                'choices' => [[
                    'message' => ['content' => 'Member context ok'],
                ]],
            ], 200),
        ]);

        $manager = User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager.assistant2@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Project Manager',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $member = User::factory()->create([
            'name' => 'Member User',
            'email' => 'member.assistant2@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Team Member',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $visibleProject = Project::create([
            'name' => 'Visible Project',
            'description' => 'Assigned to member',
            'manager_id' => $manager->id,
            'member_ids' => [$member->id],
            'budget' => '2000',
            'status' => 'Active',
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-31',
        ]);

        Task::create([
            'project_id' => $visibleProject->id,
            'title' => 'Assigned task',
            'description' => 'Should be visible',
            'assignee_id' => $member->id,
            'status' => 'In Progress',
            'priority' => 2,
            'due_date' => '2026-07-12',
        ]);

        $hiddenProject = Project::create([
            'name' => 'Hidden Project',
            'description' => 'Not assigned to member',
            'manager_id' => $manager->id,
            'member_ids' => [],
            'budget' => '3000',
            'status' => 'Planning',
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-31',
        ]);

        Task::create([
            'project_id' => $hiddenProject->id,
            'title' => 'Hidden task',
            'description' => 'Should stay hidden',
            'assignee_id' => $manager->id,
            'status' => 'Todo',
            'priority' => 1,
            'due_date' => '2026-07-15',
        ]);

        $response = $this->withAuthenticatedUser($member)->postJson('/api/ai-assistant/chat', [
            'message' => 'What is my work?',
        ]);

        $response->assertStatus(200);

        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true, 512, JSON_THROW_ON_ERROR);
            $content = $body['messages'][0]['content'];
            return str_contains($content, 'Visible Project') && !str_contains($content, 'Hidden Project');
        });
    }

    private function withAuthenticatedUser(User $user)
    {
        $token = JWTAuth::fromUser($user);

        return $this->withHeader('Authorization', 'Bearer ' . $token);
    }
}
