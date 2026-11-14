<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->with(['items.addOns', 'table'])
            ->where('user_id', $request->user()->id)
            ->latest('placed_at')
            ->paginate(10);

        return ApiResponse::success(
            OrderResource::collection($orders->items()),
            'Your orders loaded.',
            200,
            ApiResponse::paginationMeta($orders),
        );
    }

    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::query()
            ->with(['items.addOns', 'table'])
            ->where('user_id', $request->user()->id)
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        return ApiResponse::success(new OrderResource($order), 'Order loaded.');
    }
}
