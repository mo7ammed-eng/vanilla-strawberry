<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Coupon */
class CouponResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'description' => $this->description,
            'discount_type' => $this->discount_type->value,
            'value' => $this->value,
            'display_value' => $this->displayValue(),
            'min_order_cents' => $this->min_order_cents,
            'max_uses' => $this->max_uses,
            'times_used' => $this->times_used,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'is_active' => $this->is_active,
            'is_available' => $this->canBeUsed(),
        ];
    }
}
