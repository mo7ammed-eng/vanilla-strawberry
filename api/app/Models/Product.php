<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'short_description',
        'description',
        'ingredients',
        'allergens',
        'image_url',
        'price_cents',
        'compare_at_price_cents',
        'is_active',
        'is_new_arrival',
        'is_best_seller',
        'is_budget',
        'is_premium',
        'is_featured',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'compare_at_price_cents' => 'integer',
            'is_active' => 'boolean',
            'is_new_arrival' => 'boolean',
            'is_best_seller' => 'boolean',
            'is_budget' => 'boolean',
            'is_premium' => 'boolean',
            'is_featured' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('sort_order');
    }

    public function addOns(): BelongsToMany
    {
        return $this->belongsToMany(AddOn::class)->withTimestamps();
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeCollection(Builder $query, string $collection): Builder
    {
        return match ($collection) {
            'new' => $query->where('is_new_arrival', true),
            'best' => $query->where('is_best_seller', true),
            'budget' => $query->where('is_budget', true),
            'premium' => $query->where('is_premium', true),
            default => $query,
        };
    }

    public function defaultVariant(): ?ProductVariant
    {
        return $this->variants->firstWhere('is_default', true) ?? $this->variants->first();
    }
}
