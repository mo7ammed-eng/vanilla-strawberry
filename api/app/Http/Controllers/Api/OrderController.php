<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function store(CreateOrderRequest $request, OrderService $orders): JsonResponse
    {
        $order = $orders->create($request->validated(), $request->user('sanctum'));

        $payload = (new OrderResource($order))->resolve();

        if ($order->guest_token !== null) {
            $payload['guest_token'] = $order->guest_token;
        }

        return ApiResponse::success($payload, 'Order placed successfully.', 201);
    }

    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::query()
            ->with(['items.addOns', 'table'])
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        $user = $request->user('sanctum');
        $guestToken = (string) $request->query('token', '');

        $allowed = ($user !== null && ($user->isAdmin() || $user->isChef() || $order->user_id === $user->id))
            || ($order->guest_token !== null && $guestToken !== '' && hash_equals($order->guest_token, $guestToken));

        abort_unless($allowed, 403, 'You are not allowed to view this order.');

        return ApiResponse::success(new OrderResource($order), 'Order loaded.');
    }
}
