<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;
use Illuminate\Support\Facades\DB;
use App\Models\AuditLog;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::query()->with(['assignee','project']);
        if ($request->has('search')) {
            $s = $request->get('search');
            $query->where('title', 'ilike', "%{$s}%");
        }
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }
        if ($request->has('project_id')) {
            $query->where('project_id', $request->get('project_id'));
        }
        $perPage = intval($request->get('perPage', 10));
        $tasks = $query->orderBy('created_at','desc')->paginate($perPage);
        return response()->json($tasks);
    }

    public function show($id)
    {
        $task = Task::with(['comments','assignee','project'])->findOrFail($id);
        return response()->json($task);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|integer|exists:users,id',
            'status' => 'nullable|string',
            'priority' => 'nullable|integer',
        ]);

        return DB::transaction(function () use ($data, $request) {
            $task = Task::create($data);
            AuditLog::create([
                'user_id' => $request->user()?->id,
                'event' => 'task.created',
                'auditable_type' => Task::class,
                'auditable_id' => $task->id,
                'new_values' => $task->toArray(),
            ]);
            return response()->json($task, 201);
        });
    }

    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|integer|exists:users,id',
            'status' => 'nullable|string',
            'priority' => 'nullable|integer',
        ]);

        return DB::transaction(function () use ($task, $data, $request) {
            $old = $task->getOriginal();
            $task->update($data);
            AuditLog::create([
                'user_id' => $request->user()?->id,
                'event' => 'task.updated',
                'auditable_type' => Task::class,
                'auditable_id' => $task->id,
                'old_values' => $old,
                'new_values' => $task->toArray(),
            ]);
            return response()->json($task);
        });
    }

    public function destroy(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        return DB::transaction(function () use ($task, $request) {
            $task->delete();
            AuditLog::create([
                'user_id' => $request->user()?->id,
                'event' => 'task.deleted',
                'auditable_type' => Task::class,
                'auditable_id' => $task->id,
                'old_values' => $task->toArray(),
            ]);
            return response()->json(['message' => 'deleted']);
        });
    }
}
