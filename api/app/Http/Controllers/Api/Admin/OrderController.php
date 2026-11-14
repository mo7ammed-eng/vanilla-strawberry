<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'source' => ['nullable', 'in:online,qr'],
            'fulfillment_type' => ['nullable', 'in:delivery,pickup,dine_in'],
            'search' => ['nullable', 'string', 'max:120'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Order::query()->with(['items.addOns', 'table']);

        foreach (['status', 'source', 'fulfillment_type'] as $filter) {
            if (! empty($validated[$filter])) {
                $query->where($filter, $validated[$filter]);
            }
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($builder) use ($search): void {
                $builder->where('order_number', 'like', '%'.$search.'%')
                    ->orWhere('customer_name', 'like', '%'.$search.'%')
                    ->orWhere('customer_email', 'like', '%'.$search.'%');
            });
        }

        if (! empty($validated['from'])) {
            $query->whereDate('placed_at', '>=', $validated['from']);
        }

        if (! empty($validated['to'])) {
            $query->whereDate('placed_at', '<=', $validated['to']);
        }

        $orders = $query->latest('placed_at')->paginate((int) ($validated['per_page'] ?? 20));

        return ApiResponse::success(
            OrderResource::collection($orders->items()),
            'Orders loaded.',
            200,
            [
                ...ApiResponse::paginationMeta($orders),
                'counts' => collect(OrderStatus::cases())
                    ->mapWithKeys(fn (OrderStatus $status): array => [$status->value => Order::query()->where('status', $status->value)->count()])
                    ->all(),
            ],
        );
    }

    public function show(Order $order): JsonResponse
    {
        return ApiResponse::success(
            new OrderResource($order->load(['items.addOns', 'table'])),
            'Order loaded.',
        );
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order, OrderService $orders): JsonResponse
    {
        $order = $orders->transition(
            $order,
            OrderStatus::from($request->validated('status')),
            $request->user(),
            $request->validated('reason'),
        );

        return ApiResponse::success(new OrderResource($order), 'Order status updated.');
    }
}
