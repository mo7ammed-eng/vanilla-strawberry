<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()->notifications()->paginate(20);

        return ApiResponse::success(
            NotificationResource::collection($notifications->items()),
            'Notifications loaded.',
            200,
            [
                ...ApiResponse::paginationMeta($notifications),
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ],
        );
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->whereKey($id)->firstOrFail();
        $notification->markAsRead();

        return ApiResponse::success(new NotificationResource($notification), 'Notification marked as read.');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return ApiResponse::success(null, 'All notifications marked as read.');
    }
}
