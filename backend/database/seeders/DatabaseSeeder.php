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
        User::firstOrCreate(
            ['email' => 'admin1@tlab.local'],
            [
                'name' => 'Default Administrator One',
                'password' => Hash::make('Admin@1234'),
                'role' => 'Administrator',
                'status' => 'Active',
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'admin2@tlab.local'],
            [
                'name' => 'Default Administrator Two',
                'password' => Hash::make('Admin@1234'),
                'role' => 'Administrator',
                'status' => 'Active',
                'email_verified_at' => now(),
            ]
        );
    }
}
