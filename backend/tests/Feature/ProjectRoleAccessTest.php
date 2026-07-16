<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ProjectRoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_sees_all_projects_and_manager_can_create_and_update_projects_with_members(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin.project@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Administrator',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $manager = User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager.project@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Project Manager',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $member = User::factory()->create([
            'name' => 'Member User',
            'email' => 'member.project@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Team Member',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $projectOne = Project::create([
            'name' => 'Alpha Project',
            'description' => 'First project',
            'manager_id' => $manager->id,
            'member_ids' => [$member->id],
            'budget' => '1000',
            'status' => 'Active',
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-31',
        ]);

        $projectTwo = Project::create([
            'name' => 'Beta Project',
            'description' => 'Second project',
            'manager_id' => $manager->id,
            'member_ids' => [$member->id],
            'budget' => '2500',
            'status' => 'Planning',
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-31',
        ]);

        $adminResponse = $this->withAuthenticatedUser($admin)->getJson('/api/projects');
        $adminResponse->assertStatus(200);
        $adminProjectIds = collect($adminResponse->json('data'))->pluck('id')->all();
        $this->assertContains($projectOne->id, $adminProjectIds);
        $this->assertContains($projectTwo->id, $adminProjectIds);

        $createResponse = $this->withAuthenticatedUser($manager)->postJson('/api/projects', [
            'name' => 'Gamma Project',
            'description' => 'Created by manager',
            'manager_id' => $manager->id,
            'member_ids' => [$member->id],
            'budget' => '5000',
            'status' => 'Active',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'milestones' => [['name' => 'Kickoff']],
            'sprints' => [['name' => 'Sprint 1']],
        ]);

        $createResponse->assertStatus(201);
        $this->assertDatabaseHas('projects', [
            'name' => 'Gamma Project',
            'manager_id' => $manager->id,
        ]);
        $this->assertSame([$member->id], Project::where('name', 'Gamma Project')->first()->member_ids);

        $project = Project::where('name', 'Gamma Project')->first();
        $updateResponse = $this->withAuthenticatedUser($manager)->putJson('/api/projects/' . $project->id, [
            'name' => 'Gamma Project Updated',
            'member_ids' => [$member->id],
        ]);

        $updateResponse->assertStatus(200);
        $this->assertSame([$member->id], Project::find($project->id)->member_ids);
    }

    public function test_team_member_sees_only_projects_they_are_assigned_to(): void
    {
        $manager = User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager.member-list@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Project Manager',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $member = User::factory()->create([
            'name' => 'Member User',
            'email' => 'member.list@example.com',
            'password' => Hash::make('StrongPass1!'),
            'role' => 'Team Member',
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $assignedProject = Project::create([
            'name' => 'Assigned Project',
            'description' => 'Visible to member',
            'manager_id' => $manager->id,
            'member_ids' => [$member->id],
            'budget' => '100',
            'status' => 'Active',
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-31',
        ]);

        Project::create([
            'name' => 'Hidden Project',
            'description' => 'Should not be visible',
            'manager_id' => $manager->id,
            'member_ids' => [],
            'budget' => '100',
            'status' => 'Active',
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-31',
        ]);

        $response = $this->withAuthenticatedUser($member)->getJson('/api/projects');

        $response->assertStatus(200);
        $projectIds = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($assignedProject->id, $projectIds);
        $this->assertNotContains($assignedProject->id + 1, $projectIds);
    }

    private function withAuthenticatedUser(User $user)
    {
        $token = JWTAuth::fromUser($user);

        return $this->withHeader('Authorization', 'Bearer ' . $token);
    }
}
