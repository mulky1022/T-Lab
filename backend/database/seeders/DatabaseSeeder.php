<?php

namespace Database\Seeders;

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
    }
}
