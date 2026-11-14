<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\FulfillmentType;
use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Coupon;
use App\Models\CouponRedemption;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\TableSession;
use App\Models\User;
use App\Notifications\OrderPlacedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private readonly CouponService $coupons,
        private readonly OrderStatusService $statuses,
    ) {
    }

    /** @param array<string, mixed> $data */
    public function create(array $data, ?User $user): Order
    {
        return DB::transaction(function () use ($data, $user): Order {
            $lines = $this->buildLines($data['items']);
            $subtotal = array_sum(array_column($lines, 'line_total_cents'));
            $session = $this->resolveTableSession($data['table_session_token'] ?? null);

            $delivery = $session === null && $data['fulfillment_type'] === FulfillmentType::Delivery->value;
            $source = $session === null ? OrderSource::Online : OrderSource::Qr;
            $fulfillment = $session === null
                ? FulfillmentType::from($data['fulfillment_type'])
                : FulfillmentType::DineIn;

            $coupon = null;
            $discount = 0;

            if (! empty($data['coupon_code'])) {
                $coupon = $this->coupons->validateForSubtotal($data['coupon_code'], $subtotal, true);
                $discount = $coupon->discountFor($subtotal);
            }

            $taxable = max(0, $subtotal - $discount);
            $tax = (int) round($taxable * (Setting::int('tax_rate_bps', 888) / 10000));
            $serviceFee = (int) round($subtotal * (Setting::int('service_fee_bps', 0) / 10000));
            $deliveryFee = 0;

            if ($delivery) {
                $threshold = Setting::int('free_delivery_threshold_cents', 6000);
                $deliveryFee = $threshold > 0 && $subtotal >= $threshold
                    ? 0
                    : Setting::int('delivery_fee_cents', 600);
            }

            $total = $subtotal + $tax + $serviceFee + $deliveryFee - $discount;

            $paymentMethod = $data['payment_method'] ?? ($delivery ? 'pay_on_delivery' : 'pay_on_collection');

            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'user_id' => $user?->id,
                'source' => $source,
                'fulfillment_type' => $fulfillment,
                'status' => OrderStatus::Pending,
                'table_id' => $session?->table_id,
                'table_session_id' => $session?->id,
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'] ?? $user?->email,
                'customer_phone' => $data['customer_phone'] ?? $user?->phone,
                'delivery_address_line1' => $delivery ? $data['delivery_address_line1'] : null,
                'delivery_address_line2' => $delivery ? ($data['delivery_address_line2'] ?? null) : null,
                'delivery_city' => $delivery ? $data['delivery_city'] : null,
                'delivery_postal_code' => $delivery ? $data['delivery_postal_code'] : null,
                'delivery_latitude' => $delivery ? ($data['delivery_latitude'] ?? null) : null,
                'delivery_longitude' => $delivery ? ($data['delivery_longitude'] ?? null) : null,
                'subtotal_cents' => $subtotal,
                'tax_cents' => $tax,
                'service_fee_cents' => $serviceFee,
                'delivery_fee_cents' => $deliveryFee,
                'discount_cents' => $discount,
                'total_cents' => $total,
                'coupon_id' => $coupon?->id,
                'coupon_code' => $coupon?->code,
                'notes' => $data['notes'] ?? null,
                'payment_method' => $paymentMethod,
                'payment_status' => 'unpaid',
                'placed_at' => now(),
                'guest_token' => $user === null ? Str::random(48) : null,
            ]);

            foreach ($lines as $line) {
                $item = $order->items()->create([
                    'product_id' => $line['product']->id,
                    'product_name' => $line['product']->name,
                    'variant_id' => $line['variant']?->id,
                    'variant_name' => $line['variant']?->name,
                    'unit_price_cents' => $line['unit_price_cents'],
                    'quantity' => $line['quantity'],
                    'line_total_cents' => $line['line_total_cents'],
                    'notes' => $line['notes'] ?? null,
                ]);

                foreach ($line['add_ons'] as $addOn) {
                    $item->addOns()->create([
                        'add_on_id' => $addOn->id,
                        'name' => $addOn->name,
                        'price_cents' => $addOn->price_cents,
                    ]);
                }
            }

            if ($coupon instanceof Coupon) {
                $coupon->increment('times_used');
                CouponRedemption::create([
                    'coupon_id' => $coupon->id,
                    'order_id' => $order->id,
                    'user_id' => $user?->id,
                    'email' => $order->customer_email,
                    'amount_cents' => $discount,
                ]);
            }

            $order->load(['items.addOns', 'table']);

            $this->notifyStaff($order);

            return $order;
        });
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return list<array<string, mixed>>
     */
    private function buildLines(array $items): array
    {
        $productIds = array_values(array_unique(array_map(static fn (array $item): int => (int) $item['product_id'], $items)));
        $products = Product::query()
            ->with(['variants', 'addOns'])
            ->whereIn('id', $productIds)
            ->where('is_active', true)
            ->get()
            ->keyBy('id');

        $lines = [];

        foreach ($items as $index => $item) {
            /** @var Product|null $product */
            $product = $products->get((int) $item['product_id']);

            if ($product === null) {
                throw ValidationException::withMessages([
                    "items.$index.product_id" => 'This flavour is no longer available.',
                ]);
            }

            $variant = null;

            if (! empty($item['variant_id'])) {
                $variant = $product->variants->firstWhere('id', (int) $item['variant_id']);

                if ($variant === null || ! $variant->is_active) {
                    throw ValidationException::withMessages([
                        "items.$index.variant_id" => 'That size is not available for this flavour.',
                    ]);
                }
            } else {
                $variant = $product->defaultVariant();
            }

            $selectedAddOns = collect($item['add_on_ids'] ?? [])
                ->unique()
                ->map(function (mixed $addOnId) use ($product, $index): mixed {
                    $addOn = $product->addOns->firstWhere('id', (int) $addOnId);

                    if ($addOn === null || ! $addOn->is_active) {
                        throw ValidationException::withMessages([
                            "items.$index.add_on_ids" => 'One of the selected extras is not available.',
                        ]);
                    }

                    return $addOn;
                })
                ->values();

            $quantity = (int) $item['quantity'];
            $unitPrice = $product->price_cents + ($variant?->price_delta_cents ?? 0);
            $addOnTotal = $selectedAddOns->sum('price_cents');
            $lineTotal = ($unitPrice + $addOnTotal) * $quantity;

            $lines[] = [
                'product' => $product,
                'variant' => $variant,
                'add_ons' => $selectedAddOns->all(),
                'quantity' => $quantity,
                'unit_price_cents' => $unitPrice,
                'line_total_cents' => $lineTotal,
                'notes' => $item['notes'] ?? null,
            ];
        }

        return $lines;
    }

    private function resolveTableSession(?string $token): ?TableSession
    {
        if ($token === null || $token === '') {
            return null;
        }

        $session = TableSession::query()
            ->with('table')
            ->where('token', $token)
            ->where('status', 'open')
            ->lockForUpdate()
            ->first();

        if ($session === null || $session->table === null || ! $session->table->is_active) {
            throw ValidationException::withMessages([
                'table_session_token' => 'This table session has ended. Please ask a host to reopen your table.',
            ]);
        }

        return $session;
    }

    private function generateOrderNumber(): string
    {
        do {
            $number = 'VS-'.now()->format('ymd').'-'.Str::upper(Str::random(5));
        } while (Order::query()->where('order_number', $number)->exists());

        return $number;
    }

    private function notifyStaff(Order $order): void
    {
        $staff = User::query()
            ->whereIn('role', [Role::Chef->value, Role::Admin->value])
            ->where('is_active', true)
            ->get();

        Notification::send($staff, new OrderPlacedNotification($order));
    }

    public function transition(Order $order, OrderStatus $target, ?User $actor, ?string $reason = null): Order
    {
        $this->statuses->assertCanTransition($order, $target, $actor);

        if ($order->status === $target) {
            return $order;
        }

        $order->status = $target;

        if ($target === OrderStatus::Completed) {
            $order->completed_at = now();
        }

        if ($target === OrderStatus::Cancelled) {
            $order->cancelled_at = now();
            $order->cancellation_reason = $reason;
        }

        $order->save();

        if ($order->user !== null) {
            $order->user->notify(new \App\Notifications\OrderStatusChangedNotification($order));
        }

        return $order->fresh(['items.addOns', 'table']);
    }
}
