<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'assignee_id',
        'status',
        'priority',
        'due_date',
    ];

    protected $casts = [
        'due_date' => 'date:Y-m-d',
    ];

    protected $appends = [
        'projectId',
        'assigneeId',
        'dueDate',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class)->whereNull('parent_id');
    }

    public function allComments()
    {
        return $this->hasMany(Comment::class);
    }

    public function getProjectIdAttribute()
    {
        return $this->attributes['project_id'] ?? null;
    }

    public function getAssigneeIdAttribute()
    {
        return $this->attributes['assignee_id'] ?? null;
    }

    public function getDueDateAttribute($value)
    {
        $rawValue = $value ?? $this->attributes['due_date'] ?? null;

        if ($rawValue instanceof \DateTimeInterface) {
            return $rawValue->format('Y-m-d');
        }

        if (is_string($rawValue) && $rawValue !== '') {
            return date('Y-m-d', strtotime($rawValue));
        }

        return null;
    }
}
