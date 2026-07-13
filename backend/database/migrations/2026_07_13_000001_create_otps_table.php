<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otps', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('type');
            $table->string('code_hash');
            $table->json('payload')->nullable();
            $table->timestamp('expires_at');
            $table->integer('attempts')->default(0);
            $table->integer('resend_count')->default(0);
            $table->string('status')->default('pending');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
            $table->index(['email', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otps');
    }
};
