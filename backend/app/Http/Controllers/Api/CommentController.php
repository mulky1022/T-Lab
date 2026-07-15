<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Comment;
use Illuminate\Support\Facades\DB;
use App\Models\AuditLog;

class CommentController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'task_id' => 'required|integer|exists:tasks,id',
            'text' => 'required|string',
            'parent_id' => 'nullable|integer|exists:comments,id',
        ]);

        return DB::transaction(function () use ($data, $request) {
            $comment = Comment::create([
                'task_id' => $data['task_id'],
                'user_id' => $request->user()->id,
                'text' => $data['text'],
                'parent_id' => $data['parent_id'] ?? null,
            ]);
            AuditLog::create([
                'user_id' => $request->user()?->id,
                'event' => 'comment.created',
                'auditable_type' => Comment::class,
                'auditable_id' => $comment->id,
                'new_values' => $comment->toArray(),
            ]);
            return response()->json($comment,201);
        });
    }

    public function update(Request $request, $id)
    {
        $comment = Comment::findOrFail($id);
        $data = $request->validate([
            'text' => 'required|string',
        ]);

        return DB::transaction(function () use ($comment, $data, $request) {
            $old = $comment->getOriginal();
            $comment->update($data);
            AuditLog::create([
                'user_id' => $request->user()?->id,
                'event' => 'comment.updated',
                'auditable_type' => Comment::class,
                'auditable_id' => $comment->id,
                'old_values' => $old,
                'new_values' => $comment->toArray(),
            ]);
            return response()->json($comment);
        });
    }

    public function destroy(Request $request, $id)
    {
        $comment = Comment::findOrFail($id);
        return DB::transaction(function () use ($comment, $request) {
            $comment->delete();
            AuditLog::create([
                'user_id' => $request->user()?->id,
                'event' => 'comment.deleted',
                'auditable_type' => Comment::class,
                'auditable_id' => $comment->id,
                'old_values' => $comment->toArray(),
            ]);
            return response()->json(['message' => 'deleted']);
        });
    }
}
