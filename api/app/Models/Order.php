<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\FulfillmentType;
use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_id',
        'source',
        'fulfillment_type',
        'status',
        'table_id',
        'table_session_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'delivery_address_line1',
        'delivery_address_line2',
        'delivery_city',
        'delivery_postal_code',
        'delivery_latitude',
        'delivery_longitude',
        'subtotal_cents',
        'tax_cents',
        'service_fee_cents',
        'delivery_fee_cents',
        'discount_cents',
        'total_cents',
        'coupon_id',
        'coupon_code',
        'notes',
        'payment_method',
        'payment_status',
        'placed_at',
        'completed_at',
        'cancelled_at',
        'cancellation_reason',
        'guest_token',
    ];

    protected $hidden = [
        'guest_token',
    ];

    protected function casts(): array
    {
        return [
            'source' => OrderSource::class,
            'fulfillment_type' => FulfillmentType::class,
            'status' => OrderStatus::class,
            'subtotal_cents' => 'integer',
            'tax_cents' => 'integer',
            'service_fee_cents' => 'integer',
            'delivery_fee_cents' => 'integer',
            'discount_cents' => 'integer',
            'total_cents' => 'integer',
            'delivery_latitude' => 'decimal:7',
            'delivery_longitude' => 'decimal:7',
            'placed_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'order_number';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id');
    }

    public function tableSession(): BelongsTo
    {
        return $this->belongsTo(TableSession::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', OrderStatus::activeValues());
    }

    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('placed_at', today());
    }

    public function isGuestOrder(): bool
    {
        return $this->user_id === null;
    }
}
