<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class DashboardAggregationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tasks_are_counted_per_project_and_status_for_authenticated_user(): void
    {
        $admin = User::factory()->create([
            'name' => 'Dashboard Admin',
            'email' => 'dashboard.admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'Administrator',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $projectOne = Project::create([
            'name' => 'Alpha',
            'description' => 'Alpha project',
            'manager_id' => $admin->id,
            'member_ids' => [],
            'budget' => 'TBC',
            'status' => 'Active',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(10)->toDateString(),
        ]);

        $projectTwo = Project::create([
            'name' => 'Beta',
            'description' => 'Beta project',
            'manager_id' => $admin->id,
            'member_ids' => [],
            'budget' => 'TBC',
            'status' => 'Planning',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(20)->toDateString(),
        ]);

        Task::create([
            'project_id' => $projectOne->id,
            'title' => 'Task 1',
            'status' => 'Todo',
            'assignee_id' => $admin->id,
            'priority' => 1,
        ]);
        Task::create([
            'project_id' => $projectOne->id,
            'title' => 'Task 2',
            'status' => 'Completed',
            'assignee_id' => $admin->id,
            'priority' => 1,
        ]);
        Task::create([
            'project_id' => $projectTwo->id,
            'title' => 'Task 3',
            'status' => 'In Progress',
            'assignee_id' => $admin->id,
            'priority' => 1,
        ]);

        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/tasks');

        $response->assertOk();
        $this->assertEquals(3, $response->json('total'));
        $this->assertCount(3, $response->json('data'));
    }
}
