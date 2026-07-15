<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Notification::query();
        if ($request->user()) {
            $query->where('user_id', $request->user()->id);
        }
        $perPage = intval($request->get('perPage', 20));
        $notifications = $query->orderBy('created_at','desc')->paginate($perPage);
        return response()->json($notifications);
    }

    public function markRead(Request $request, $id)
    {
        $notif = Notification::where('id',$id)->where('user_id',$request->user()->id)->firstOrFail();
        $notif->read = true;
        $notif->save();
        return response()->json($notif);
    }

    public function markAllRead(Request $request)
    {
        Notification::where('user_id',$request->user()->id)->update(['read' => true]);
        return response()->json(['message' => 'ok']);
    }
}
