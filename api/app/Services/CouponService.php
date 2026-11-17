<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Coupon;
use App\Models\Setting;
use Illuminate\Validation\ValidationException;

class CouponService
{
    public function findAvailable(string $code, bool $lock = false): Coupon
    {
        if (! Setting::bool(Setting::COUPONS_ENABLED, true)) {
            throw ValidationException::withMessages([
                'coupon_code' => 'Coupon codes are not available right now.',
            ]);
        }

        $query = Coupon::query()->whereRaw('UPPER(code) = ?', [strtoupper(trim($code))]);

        if ($lock) {
            $query->lockForUpdate();
        }

        $coupon = $query->first();

        if ($coupon === null || ! $coupon->canBeUsed()) {
            throw ValidationException::withMessages([
                'coupon_code' => 'This coupon is invalid or has expired.',
            ]);
        }

        return $coupon;
    }

    public function validate(string $code, ?int $subtotalCents = null, bool $lock = false): Coupon
    {
        $coupon = $this->findAvailable($code, $lock);

        if ($subtotalCents !== null && $subtotalCents < $coupon->min_order_cents) {
            throw ValidationException::withMessages([
                'coupon_code' => 'This coupon needs a minimum order of $'.number_format($coupon->min_order_cents / 100, 2).'.',
            ]);
        }

        return $coupon;
    }

    public function validateForSubtotal(string $code, int $subtotalCents, bool $lock = false): Coupon
    {
        return $this->validate($code, $subtotalCents, $lock);
    }
}
