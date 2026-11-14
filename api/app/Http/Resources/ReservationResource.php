<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Reservation */
class ReservationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservation_code' => $this->reservation_code,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'reservation_date' => $this->reservation_date->toDateString(),
            'reservation_time' => substr((string) $this->reservation_time, 0, 5),
            'party_size' => $this->party_size,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
