<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\OrderStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Order */
class OrderResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $available = [];

        if ($user !== null && $user->isChef()) {
            $available = array_map(static fn (OrderStatus $status): string => $status->value, $this->status->nextForChef());
        }

        if ($user !== null && $user->isAdmin()) {
            $available = array_map(static fn (OrderStatus $status): string => $status->value, $this->status->allowedAdminTransitions());
        }

        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'source' => $this->source->value,
            'source_label' => $this->source->label(),
            'fulfillment_type' => $this->fulfillment_type->value,
            'fulfillment_label' => $this->fulfillment_type->label(),
            'customer' => [
                'name' => $this->customer_name,
                'email' => $this->customer_email,
                'phone' => $this->customer_phone,
            ],
            'delivery_address' => $this->fulfillment_type->value === 'delivery' ? [
                'line1' => $this->delivery_address_line1,
                'line2' => $this->delivery_address_line2,
                'city' => $this->delivery_city,
                'postal_code' => $this->delivery_postal_code,
                'latitude' => $this->delivery_latitude,
                'longitude' => $this->delivery_longitude,
            ] : null,
            'table' => $this->whenLoaded('table', fn () => $this->table === null ? null : [
                'id' => $this->table->id,
                'name' => $this->table->name,
                'zone' => $this->table->zone,
            ]),
            'table_session_id' => $this->table_session_id,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'totals' => [
                'subtotal_cents' => $this->subtotal_cents,
                'tax_cents' => $this->tax_cents,
                'service_fee_cents' => $this->service_fee_cents,
                'delivery_fee_cents' => $this->delivery_fee_cents,
                'discount_cents' => $this->discount_cents,
                'total_cents' => $this->total_cents,
            ],
            'coupon_code' => $this->coupon_code,
            'notes' => $this->notes,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'placed_at' => $this->placed_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'cancellation_reason' => $this->cancellation_reason,
            'available_statuses' => $available,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
