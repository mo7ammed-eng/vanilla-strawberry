<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\OrderItemAddOn */
class OrderItemAddOnResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'add_on_id' => $this->add_on_id,
            'name' => $this->name,
            'price_cents' => $this->price_cents,
        ];
    }
}
