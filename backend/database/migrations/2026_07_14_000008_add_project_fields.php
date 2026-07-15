<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->unsignedBigInteger('manager_id')->nullable()->after('owner_id');
            $table->string('budget')->nullable()->after('status');
            $table->date('start_date')->nullable()->after('budget');
            $table->date('end_date')->nullable()->after('start_date');
            $table->json('member_ids')->nullable()->after('end_date');
            $table->json('milestones')->nullable()->after('member_ids');
            $table->json('sprints')->nullable()->after('milestones');

            $table->foreign('manager_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['manager_id']);
            $table->dropColumn(['manager_id', 'budget', 'start_date', 'end_date', 'member_ids', 'milestones', 'sprints']);
        });
    }
};
