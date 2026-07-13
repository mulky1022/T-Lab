<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Otp extends Model
{
    protected $table = 'otps';

    public $timestamps = true;

    protected $fillable = [
        'email',
        'type',
        'code_hash',
        'payload',
        'expires_at',
        'attempts',
        'resend_count',
        'status',
        'used_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];
}
