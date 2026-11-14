<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\DiscountType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'value',
        'min_order_cents',
        'max_uses',
        'times_used',
        'starts_at',
        'ends_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'discount_type' => DiscountType::class,
            'value' => 'integer',
            'min_order_cents' => 'integer',
            'max_uses' => 'integer',
            'times_used' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(CouponRedemption::class);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query
            ->where('is_active', true)
            ->where(static function (Builder $query): void {
                $query->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(static function (Builder $query): void {
                $query->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            });
    }

    public function canBeUsed(): bool
    {
        return $this->is_active
            && ($this->max_uses === null || $this->times_used < $this->max_uses)
            && ($this->starts_at === null || $this->starts_at->lte(now()))
            && ($this->ends_at === null || $this->ends_at->gte(now()));
    }

    public function discountFor(int $subtotalCents): int
    {
        $discount = match ($this->discount_type) {
            DiscountType::Percentage => (int) round($subtotalCents * ($this->value / 10000)),
            DiscountType::Fixed => $this->value,
        };

        return max(0, min($subtotalCents, $discount));
    }

    public function displayValue(): string
    {
        return match ($this->discount_type) {
            DiscountType::Percentage => rtrim(rtrim(number_format($this->value / 100, 2, '.', ''), '0'), '.').'%',
            DiscountType::Fixed => '$'.number_format($this->value / 100, 2),
        };
    }
}
