<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Project;
use Illuminate\Support\Facades\DB;
use App\Models\AuditLog;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $this->ensureAllowedRole($request->user(), 'read');

        $query = Project::query();
        if ($request->user()?->role === 'Team Member') {
            $query->whereJsonContains('member_ids', $request->user()->id);
        }
        if ($request->has('search')) {
            $s = $request->get('search');
            $query->where('name', 'ilike', "%{$s}%");
        }
        if ($request->has('status') && $request->get('status') !== 'All') {
            $status = strtolower($request->get('status'));
            $query->whereRaw('lower(status) = ?', [$status]);
        }
        $perPage = intval($request->get('perPage', 100));
        $projects = $query->orderBy('created_at','desc')->paginate($perPage);
        return response()->json($projects);
    }

    public function show(Request $request, $id)
    {
        $this->ensureAllowedRole($request->user(), 'read');

        $query = Project::query();
        if ($request->user()?->role === 'Team Member') {
            $query->whereJsonContains('member_ids', $request->user()->id);
        }

        $project = $query->with(['tasks','manager'])->findOrFail($id);
        return response()->json($project);
    }

    public function store(Request $request)
    {
        $this->ensureAllowedRole($request->user(), 'write');
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'manager_id' => 'required|integer|exists:users,id',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'integer|exists:users,id',
            'budget' => 'nullable|string',
            'status' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'milestones' => 'nullable|array',
            'sprints' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($data, $request) {
            $project = Project::create([
                'name' => $data['name'],
                'description' => $data['description'],
                'manager_id' => $data['manager_id'],
                'member_ids' => $data['member_ids'] ?? [],
                'budget' => $data['budget'] ?? 'TBC',
                'status' => $data['status'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'milestones' => $data['milestones'] ?? [],
                'sprints' => $data['sprints'] ?? [],
            ]);

            AuditLog::create([
                'user_id' => $request->user()?->id,
                'event' => 'project.created',
                'auditable_type' => Project::class,
                'auditable_id' => $project->id,
                'new_values' => $project->toArray(),
            ]);

            return response()->json($project, 201);
        });
    }

    public function update(Request $request, $id)
    {
        $this->ensureAllowedRole($request->user(), 'write');

        $project = Project::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'manager_id' => 'nullable|integer|exists:users,id',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'integer|exists:users,id',
            'budget' => 'nullable|string',
            'status' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'milestones' => 'nullable|array',
            'sprints' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($project, $data, $request) {
            $old = $project->getOriginal();
            $project->update($data);
            AuditLog::create([
                'user_id' => $request->user()?->id,
                'event' => 'project.updated',
                'auditable_type' => Project::class,
                'auditable_id' => $project->id,
                'old_values' => $old,
                'new_values' => $project->toArray(),
            ]);
            return response()->json($project);
        });
    }

    public function destroy(Request $request, $id)
    {
        $this->ensureAllowedRole($request->user(), 'write');

        $project = Project::findOrFail($id);

        return DB::transaction(function () use ($project, $request) {
            $project->delete();
            AuditLog::create([
                'user_id' => $request->user()?->id,
                'event' => 'project.deleted',
                'auditable_type' => Project::class,
                'auditable_id' => $project->id,
                'old_values' => $project->toArray(),
            ]);
            return response()->json(['message' => 'deleted']);
        });
    }

    private function ensureAllowedRole($user, string $operation = 'write'): void
    {
        if ($user?->role === 'Team Member' && in_array($operation, ['read'], true)) {
            return;
        }

        if (!in_array($user?->role, ['Administrator', 'Project Manager'], true)) {
            abort(response()->json(['message' => 'Forbidden.'], 403));
        }
    }
}
