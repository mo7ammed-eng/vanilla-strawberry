<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\RestaurantTable */
class TableResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $session = $this->relationLoaded('sessions') ? $this->sessions->firstWhere('status', 'open') : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'zone' => $this->zone,
            'capacity' => $this->capacity,
            'token' => $this->token,
            'is_active' => $this->is_active,
            'qr_url' => '/qr/'.$this->token,
            'active_session' => $session === null ? null : [
                'id' => $session->id,
                'token' => $session->token,
                'opened_at' => $session->opened_at?->toIso8601String(),
            ],
            'orders_count' => $this->whenCounted('orders'),
        ];
    }
}
