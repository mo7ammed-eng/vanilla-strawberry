<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Chef;

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
            'scope' => ['nullable', 'in:active,today,all'],
            'status' => ['nullable', 'string'],
            'search' => ['nullable', 'string', 'max:120'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Order::query()
            ->with(['items.addOns', 'table'])
            ->whereIn('source', ['online', 'qr']);

        match ($validated['scope'] ?? 'active') {
            'today' => $query->today(),
            'all' => null,
            default => $query->active(),
        };

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($builder) use ($search): void {
                $builder->where('order_number', 'like', '%'.$search.'%')
                    ->orWhere('customer_name', 'like', '%'.$search.'%');
            });
        }

        $orders = $query
            ->orderByRaw("CASE status WHEN 'pending' THEN 0 WHEN 'confirmed' THEN 1 WHEN 'preparing' THEN 2 WHEN 'ready' THEN 3 WHEN 'completed' THEN 4 ELSE 5 END")
            ->orderBy('placed_at')
            ->paginate((int) ($validated['per_page'] ?? 30));

        return ApiResponse::success(
            OrderResource::collection($orders->items()),
            'Kitchen orders loaded.',
            200,
            [
                ...ApiResponse::paginationMeta($orders),
                'counts' => [
                    'pending' => Order::query()->where('status', OrderStatus::Pending->value)->count(),
                    'confirmed' => Order::query()->where('status', OrderStatus::Confirmed->value)->count(),
                    'preparing' => Order::query()->where('status', OrderStatus::Preparing->value)->count(),
                    'ready' => Order::query()->where('status', OrderStatus::Ready->value)->count(),
                ],
            ],
        );
    }

    public function show(string $orderNumber): JsonResponse
    {
        $order = Order::query()
            ->with(['items.addOns', 'table'])
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        return ApiResponse::success(new OrderResource($order), 'Order loaded.');
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
