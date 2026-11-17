<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'settings' => ['required', 'array'],
            'settings.restaurant_name' => ['sometimes', 'required', 'string', 'max:120'],
            'settings.tagline' => ['sometimes', 'required', 'string', 'max:180'],
            'settings.address' => ['sometimes', 'required', 'string', 'max:255'],
            'settings.phone' => ['sometimes', 'required', 'string', 'max:32'],
            'settings.email' => ['sometimes', 'required', 'email', 'max:255'],
            'settings.hours' => ['sometimes', 'array', 'max:7'],
            'settings.hours.*.day' => ['required_with:settings.hours', 'string', 'max:24'],
            'settings.hours.*.open' => ['required_with:settings.hours', 'date_format:H:i'],
            'settings.hours.*.close' => ['required_with:settings.hours', 'date_format:H:i'],
            'settings.map_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'settings.instagram' => ['sometimes', 'nullable', 'string', 'max:120'],
            'settings.currency' => ['sometimes', 'required', 'string', 'size:3'],
            'settings.currency_symbol' => ['sometimes', 'required', 'string', 'max:8'],
            'settings.tax_rate_bps' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'settings.service_fee_bps' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'settings.delivery_fee_cents' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'settings.free_delivery_threshold_cents' => ['sometimes', 'integer', 'min:0', 'max:100000000'],
            'settings.reservations_enabled' => ['sometimes', 'boolean'],
            'settings.coupons_enabled' => ['sometimes', 'boolean'],
            'settings.reservation_capacity_per_slot' => ['sometimes', 'integer', 'min:1', 'max:200'],
            'settings.reservation_slots' => ['sometimes', 'array', 'max:96'],
            'settings.reservation_slots.*' => ['date_format:H:i'],
            'settings.established_year' => ['sometimes', 'integer', 'min:1900', 'max:2100'],
        ];
    }
}
