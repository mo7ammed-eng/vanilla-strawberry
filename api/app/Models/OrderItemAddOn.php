<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemAddOn extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_item_id',
        'add_on_id',
        'name',
        'price_cents',
    ];

    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id');
    }
}
