<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    public const RESERVATIONS_ENABLED = 'reservations_enabled';

    public const COUPONS_ENABLED = 'coupons_enabled';

    protected $fillable = [
        'key',
        'value',
        'group',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'json',
        ];
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::query()->where('key', $key)->first();

        return $setting?->value ?? $default;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $value = static::get($key, $default);

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
    }

    public static function int(string $key, int $default = 0): int
    {
        $value = static::get($key, $default);

        return is_numeric($value) ? (int) $value : $default;
    }

    public static function put(string $key, mixed $value, string $group = 'general'): self
    {
        return static::query()->updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'group' => $group],
        );
    }

    /** @return array<string, mixed> */
    public static function publicPayload(): array
    {
        return [
            'restaurant_name' => static::get('restaurant_name', 'Vanilla & Strawberry'),
            'tagline' => static::get('tagline', 'Small-batch gelato, made slowly.'),
            'address' => static::get('address', '14 Orchard Lane, Brooklyn, NY 11201'),
            'phone' => static::get('phone', '(718) 555-0142'),
            'email' => static::get('email', 'hello@vanillaandstrawberry.test'),
            'hours' => static::get('hours', []),
            'map_url' => static::get('map_url', 'https://maps.google.com/?q=14+Orchard+Lane+Brooklyn+NY'),
            'instagram' => static::get('instagram', '@vanillaandstrawberry'),
            'established_year' => static::int('established_year', 2018),
            'currency' => static::get('currency', 'USD'),
            'currency_symbol' => static::get('currency_symbol', '$'),
            'tax_rate_bps' => static::int('tax_rate_bps', 888),
            'service_fee_bps' => static::int('service_fee_bps', 0),
            'delivery_fee_cents' => static::int('delivery_fee_cents', 600),
            'free_delivery_threshold_cents' => static::int('free_delivery_threshold_cents', 6000),
            'reservations_enabled' => static::bool(self::RESERVATIONS_ENABLED, true),
            'coupons_enabled' => static::bool(self::COUPONS_ENABLED, true),
            'reservation_capacity_per_slot' => static::int('reservation_capacity_per_slot', 24),
        ];
    }
}
