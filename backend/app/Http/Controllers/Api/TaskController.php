<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Support\Facades\DB;
use App\Models\AuditLog;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Task::query()->with(['assignee', 'project']);

        if ($user?->role === 'Team Member') {
            $query->where('assignee_id', $user->id);
        } elseif ($user?->role === 'Project Manager') {
            $query->where(function ($query) use ($user) {
                $query->whereHas('project', function ($query) use ($user) {
                    $query->where('manager_id', $user->id);
                })
                ->orWhere('assignee_id', $user->id);
            });
        }

        if ($request->has('search')) {
            $s = $request->get('search');
            $query->where('title', 'ilike', "%{$s}%");
        }

        if ($request->has('status')) {
            $status = strtolower($request->get('status'));
            $query->whereRaw('lower(status) = ?', [$status]);
        }

        if ($request->has('project_id')) {
            $query->where('project_id', $request->get('project_id'));
        }

        $perPage = intval($request->get('perPage', 10));
        $tasks = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($tasks);
    }

    public function show(Request $request, $id)
    {
        $task = Task::with(['comments', 'assignee', 'project'])->findOrFail($id);
        $this->authorizeTaskAccess($request->user(), $task);
        return response()->json($task);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!in_array($user?->role, ['Administrator', 'Project Manager'])) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|integer|exists:users,id',
            'status' => 'nullable|string',
            'priority' => 'nullable|integer',
            'due_date' => 'nullable|date',
        ]);

        if ($user->role === 'Project Manager') {
            $project = Project::findOrFail($data['project_id']);
            if ($project->manager_id !== $user->id) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

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
        $task = Task::with('project')->findOrFail($id);
        $user = $request->user();
        $this->authorizeTaskAccess($user, $task);

        $rules = [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|integer|exists:users,id',
            'status' => 'nullable|string',
            'priority' => 'nullable|integer',
            'due_date' => 'nullable|date',
        ];

        if ($user?->role === 'Team Member') {
            $rules = ['status' => 'required|string'];
        }

        $data = $request->validate($rules);

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
        $task = Task::with('project')->findOrFail($id);
        $user = $request->user();

        if ($user?->role !== 'Administrator') {
            if ($user?->role !== 'Project Manager' || $task->project->manager_id !== $user->id) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

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

    private function authorizeTaskAccess($user, Task $task)
    {
        if ($user?->role === 'Administrator') {
            return;
        }

        if ($user?->role === 'Project Manager') {
            if ($task->project?->manager_id === $user->id || $task->assignee_id === $user->id) {
                return;
            }
        }

        if ($user?->role === 'Team Member' && $task->assignee_id === $user->id) {
            return;
        }

        abort(response()->json(['message' => 'Forbidden.'], 403));
    }
}
