<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AuditLog;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::query()->with('user');
        if ($request->has('search')) {
            $s = $request->get('search');
            $query->where('event', 'ilike', "%{$s}%");
        }
        $perPage = intval($request->get('perPage', 20));
        $logs = $query->orderBy('created_at','desc')->paginate($perPage);
        return response()->json($logs);
    }
}
