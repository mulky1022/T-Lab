<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiAssistantController extends Controller
{
    public function chat(Request $request)
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:4000'],
        ]);

        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $projects = $this->getVisibleProjects($user);
        $tasks = $this->getVisibleTasks($user, $projects);

        $systemPrompt = $this->buildSystemPrompt($user);
        $context = $this->buildContextPayload($user, $projects, $tasks);

        $apiKey = env('OPENROUTER_API_KEY');
        if (empty($apiKey)) {
            return response()->json(['message' => 'The AI assistant is not configured yet.'], 500);
        }

        try {
            $response = Http::timeout(60)
                ->withOptions(['verify' => false])
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'HTTP-Referer' => config('app.url', 'http://localhost'),
                    'X-Title' => 'T Lab',
                    'Accept' => 'application/json',
                ])
                ->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => 'nvidia/nemotron-3-ultra-550b-a55b:free',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => $systemPrompt . "\n\nAvailable project/task data:\n" . $context,
                        ],
                        [
                            'role' => 'user',
                            'content' => $data['message'],
                        ],
                    ],
                    'temperature' => 0.2,
                    'max_tokens' => 400,
                ]);

            if (! $response->successful()) {
                $details = $response->json();
                Log::warning('OpenRouter assistant call failed.', [
                    'user_id' => $user->id,
                    'status' => $response->status(),
                    'details' => $details,
                ]);

                return response()->json([
                    'message' => 'The assistant could not answer right now.',
                ], 502);
            }

            $reply = $response->json('choices.0.message.content', "I don't have information about that");

            return response()->json([
                'reply' => $reply,
                'context' => [
                    'projects' => $projects->count(),
                    'tasks' => $tasks->count(),
                ],
            ]);
        } catch (\Throwable $exception) {
            Log::error('OpenRouter assistant request error.', [
                'user_id' => $user->id,
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'The assistant could not answer right now.',
            ], 502);
        }
    }

    private function getVisibleProjects(User $user)
    {
        $query = Project::query()->orderBy('created_at', 'desc');

        if ($user->role === 'Team Member') {
            $query->whereJsonContains('member_ids', $user->id);
        } elseif ($user->role === 'Project Manager') {
            $query->where('manager_id', $user->id);
        }

        return $query->get();
    }

    private function getVisibleTasks(User $user, $projects)
    {
        $query = Task::query()->with('project')->orderBy('created_at', 'desc');

        if ($user->role === 'Team Member') {
            $query->where('assignee_id', $user->id)
                ->whereIn('project_id', $projects->pluck('id'));
        } elseif ($user->role === 'Project Manager') {
            $query->where(function ($inner) use ($user, $projects) {
                $inner->whereIn('project_id', $projects->pluck('id'))
                    ->orWhere('assignee_id', $user->id);
            });
        }

        return $query->get();
    }

    private function buildSystemPrompt(User $user): string
    {
        return sprintf(
            "You are T LAB's project assistant for %s %s. Answer only using the project and task data provided below. If the question cannot be answered from that data, reply exactly: I don't have information about that. Do not use outside knowledge or make up project details. Keep the answer concise and relevant to projects and tasks.",
            $user->name,
            $user->role
        );
    }

    private function buildContextPayload(User $user, $projects, $tasks): string
    {
        $projectContext = $projects->map(function (Project $project) use ($user) {
            return [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status,
                'description' => $project->description,
                'manager_id' => $project->manager_id,
                'member_ids' => $project->member_ids ?? [],
            ];
        })->values()->all();

        $taskContext = $tasks->map(function (Task $task) {
            return [
                'id' => $task->id,
                'project_id' => $task->project_id,
                'project_name' => $task->project?->name,
                'title' => $task->title,
                'status' => $task->status,
                'priority' => $task->priority,
                'assignee_id' => $task->assignee_id,
                'due_date' => $task->due_date ? (is_string($task->due_date) ? $task->due_date : $task->due_date->toDateString()) : null,
            ];
        })->values()->all();

        return json_encode([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
            ],
            'projects' => $projectContext,
            'tasks' => $taskContext,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }
}
