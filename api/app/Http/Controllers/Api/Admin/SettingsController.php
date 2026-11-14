<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SettingsRequest;
use App\Models\Setting;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class SettingsController extends Controller
{
    /** @var array<string, string> */
    private const TYPES = [
        'restaurant_name' => 'string',
        'tagline' => 'string',
        'address' => 'string',
        'phone' => 'string',
        'email' => 'string',
        'hours' => 'array',
        'map_url' => 'string',
        'instagram' => 'string',
        'currency' => 'string',
        'currency_symbol' => 'string',
        'tax_rate_bps' => 'integer',
        'service_fee_bps' => 'integer',
        'delivery_fee_cents' => 'integer',
        'free_delivery_threshold_cents' => 'integer',
        'reservations_enabled' => 'boolean',
        'coupons_enabled' => 'boolean',
        'reservation_capacity_per_slot' => 'integer',
        'reservation_slots' => 'array',
        'established_year' => 'integer',
    ];

    public function index(): JsonResponse
    {
        $settings = Setting::query()->orderBy('group')->orderBy('key')->get()
            ->mapWithKeys(static fn (Setting $setting): array => [$setting->key => $setting->value]);

        return ApiResponse::success([
            'settings' => $settings,
            'public' => Setting::publicPayload(),
            'schema' => self::TYPES,
        ], 'Settings loaded.');
    }

    public function update(SettingsRequest $request): JsonResponse
    {
        $incoming = $request->validated('settings');
        $errors = [];

        foreach ($incoming as $key => $value) {
            if (! array_key_exists($key, self::TYPES)) {
                $errors["settings.$key"] = ['This setting cannot be changed.'];
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        foreach ($incoming as $key => $value) {
            $group = str_contains($key, 'enabled') || in_array($key, ['tax_rate_bps', 'service_fee_bps', 'delivery_fee_cents', 'free_delivery_threshold_cents'], true)
                ? 'operations'
                : 'general';

            Setting::put($key, $this->coerce(self::TYPES[$key], $value), $group);
        }

        $settings = Setting::query()->orderBy('group')->orderBy('key')->get()
            ->mapWithKeys(static fn (Setting $setting): array => [$setting->key => $setting->value]);

        return ApiResponse::success([
            'settings' => $settings,
            'public' => Setting::publicPayload(),
        ], 'Settings saved.');
    }

    private function coerce(string $type, mixed $value): mixed
    {
        return match ($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $value,
            'array' => is_array($value) ? array_values($value) : [],
            default => is_string($value) ? trim($value) : (string) $value,
        };
    }
}
