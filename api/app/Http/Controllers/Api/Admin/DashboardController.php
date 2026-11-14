<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Enums\ReservationStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $ordersToday = Order::query()->today();
        $revenueToday = Order::query()->today()->where('status', OrderStatus::Completed->value)->sum('total_cents');
        $revenueYesterday = Order::query()
            ->whereDate('placed_at', today()->subDay())
            ->where('status', OrderStatus::Completed->value)
            ->sum('total_cents');

        $salesRows = Order::query()
            ->where('placed_at', '>=', today()->subDays(6))
            ->where('status', '!=', OrderStatus::Cancelled->value)
            ->get(['total_cents', 'placed_at']);

        $salesByDay = $salesRows
            ->groupBy(fn (Order $order): string => $order->placed_at->toDateString())
            ->map(fn ($rows): int => (int) $rows->sum('total_cents'));

        $salesLast7 = collect(range(6, 0))->map(function (int $daysAgo) use ($salesByDay): array {
            $date = today()->subDays($daysAgo)->toDateString();

            return ['date' => $date, 'total_cents' => $salesByDay[$date] ?? 0];
        });

        $topProducts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', '!=', OrderStatus::Cancelled->value)
            ->where('orders.placed_at', '>=', now()->subDays(30))
            ->select('order_items.product_name', DB::raw('SUM(order_items.quantity) as quantity'), DB::raw('SUM(order_items.line_total_cents) as revenue_cents'))
            ->groupBy('order_items.product_name')
            ->orderByDesc('quantity')
            ->limit(5)
            ->get();

        $recentOrders = Order::query()
            ->with(['items.addOns', 'table'])
            ->latest('placed_at')
            ->limit(6)
            ->get();

        return ApiResponse::success([
            'stats' => [
                'orders_today' => (clone $ordersToday)->count(),
                'active_orders' => Order::query()->active()->count(),
                'revenue_today_cents' => (int) $revenueToday,
                'revenue_yesterday_cents' => (int) $revenueYesterday,
                'customers' => User::query()->where('role', Role::Customer->value)->count(),
                'active_products' => Product::query()->where('is_active', true)->count(),
                'upcoming_reservations' => Reservation::query()
                    ->whereDate('reservation_date', '>=', today())
                    ->whereIn('status', [ReservationStatus::Pending->value, ReservationStatus::Confirmed->value])
                    ->count(),
            ],
            'sales_last_7_days' => $salesLast7,
            'top_products' => $topProducts,
            'recent_orders' => OrderResource::collection($recentOrders),
        ], 'Dashboard loaded.');
    }
}
