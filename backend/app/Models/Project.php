<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'owner_id',
        'manager_id',
        'status',
        'budget',
        'start_date',
        'end_date',
        'member_ids',
        'milestones',
        'sprints',
    ];

    protected $casts = [
        'member_ids' => 'array',
        'milestones' => 'array',
        'sprints' => 'array',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
    ];

    protected $hidden = [
        'manager_id',
        'member_ids',
        'started_at',
        'updated_at',
        'created_at',
    ];

    protected $appends = [
        'managerId',
        'memberIds',
        'startDate',
        'endDate',
        'createdDate',
        'updatedDate',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function getManagerIdAttribute()
    {
        return $this->attributes['manager_id'] ?? null;
    }

    public function getMemberIdsAttribute()
    {
        return $this->attributes['member_ids'] ? json_decode($this->attributes['member_ids'], true) : [];
    }

    public function getStartDateAttribute($value)
    {
        return $value ? date('Y-m-d', strtotime($value)) : null;
    }

    public function getEndDateAttribute($value)
    {
        return $value ? date('Y-m-d', strtotime($value)) : null;
    }

    public function getCreatedDateAttribute()
    {
        return $this->created_at ? $this->created_at->format('Y-m-d') : null;
    }

    public function getUpdatedDateAttribute()
    {
        return $this->updated_at ? $this->updated_at->format('Y-m-d') : null;
    }
}
