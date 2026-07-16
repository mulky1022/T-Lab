<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Administrator 1
        User::firstOrCreate(
            ['email' => 'admin1@tlab.com'],
            [
                'name' => 'Nimal Perera',
                'password' => Hash::make('Admin@123'),
                'role' => 'Administrator',
                'status' => 'Active',
                'email_verified_at' => now(),
            ]
        );

        // Administrator 2
        User::firstOrCreate(
            ['email' => 'admin2@tlab.com'],
            [
                'name' => 'Kasun Fernando',
                'password' => Hash::make('Admin@123'),
                'role' => 'Administrator',
                'status' => 'Active',
                'email_verified_at' => now(),
            ]
        );

        // Project Manager
        User::firstOrCreate(
            ['email' => 'manager@tlab.com'],
            [
                'name' => 'Chamith Jayasinghe',
                'password' => Hash::make('Manager@123'),
                'role' => 'Project Manager',
                'status' => 'Active',
                'email_verified_at' => now(),
            ]
        );

        // Team Member
        User::firstOrCreate(
            ['email' => 'member@tlab.com'],
            [
                'name' => 'Sahan Wickramasinghe',
                'password' => Hash::make('Member@123'),
                'role' => 'Team Member',
                'status' => 'Active',
                'email_verified_at' => now(),
            ]
        );

        $manager = User::where('email', 'manager@tlab.com')->first();
        $member = User::where('email', 'member@tlab.com')->first();

        if ($manager && $member) {
            $projectOne = Project::firstOrCreate(
                ['name' => 'LankaTech Platform Modernization'],
                [
                    'description' => 'Modernize the core task and project management experience for LankaTech teams.',
                    'manager_id' => $manager->id,
                    'member_ids' => [$member->id],
                    'budget' => 'LKR 6,500,000',
                    'status' => 'Active',
                    'start_date' => now()->subDays(7)->toDateString(),
                    'end_date' => now()->addDays(21)->toDateString(),
                    'milestones' => [
                        ['title' => 'Requirements', 'completed' => true],
                        ['title' => 'Design', 'completed' => false],
                        ['title' => 'Implementation', 'completed' => false],
                    ],
                    'sprints' => [
                        ['name' => 'Sprint 1', 'goal' => 'Dashboard and tasks'],
                        ['name' => 'Sprint 2', 'goal' => 'Projects and team views'],
                    ],
                    'owner_id' => $manager->id,
                ]
            );

            $projectTwo = Project::firstOrCreate(
                ['name' => 'Resend Notification Integration'],
                [
                    'description' => 'Add automated email and reminder notifications for project updates.',
                    'manager_id' => $manager->id,
                    'member_ids' => [$member->id],
                    'budget' => 'LKR 3,200,000',
                    'status' => 'Planning',
                    'start_date' => now()->toDateString(),
                    'end_date' => now()->addDays(30)->toDateString(),
                    'milestones' => [
                        ['title' => 'Email templates', 'completed' => false],
                        ['title' => 'OTP flows', 'completed' => false],
                    ],
                    'sprints' => [
                        ['name' => 'Sprint 1', 'goal' => 'Email delivery'],
                    ],
                    'owner_id' => $manager->id,
                ]
            );

            Task::firstOrCreate(
                ['project_id' => $projectOne->id, 'title' => 'Design dashboard charts'],
                [
                    'description' => 'Build project and task summaries on the new dashboard.',
                    'assignee_id' => $member->id,
                    'status' => 'Todo',
                    'priority' => 2,
                    'due_date' => now()->addDays(5)->toDateString(),
                ]
            );

            Task::firstOrCreate(
                ['project_id' => $projectOne->id, 'title' => 'Implement board drag and drop'],
                [
                    'description' => 'Allow team members to move tasks across status columns.',
                    'assignee_id' => $member->id,
                    'status' => 'In Progress',
                    'priority' => 3,
                    'due_date' => now()->addDays(10)->toDateString(),
                ]
            );

            Task::firstOrCreate(
                ['project_id' => $projectTwo->id, 'title' => 'Create OTP email templates'],
                [
                    'description' => 'Design the verification and reset email content for OTP workflows.',
                    'assignee_id' => $member->id,
                    'status' => 'Todo',
                    'priority' => 2,
                    'due_date' => now()->addDays(12)->toDateString(),
                ]
            );

            Task::firstOrCreate(
                ['project_id' => $projectTwo->id, 'title' => 'Configure resend delivery settings'],
                [
                    'description' => 'Wire up the backend email transport and test send flows.',
                    'assignee_id' => $member->id,
                    'status' => 'Todo',
                    'priority' => 3,
                    'due_date' => now()->addDays(18)->toDateString(),
                ]
            );
        }
    }
}
