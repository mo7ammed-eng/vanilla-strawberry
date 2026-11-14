<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Product */
class ProductResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'name' => $this->name,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'ingredients' => $this->ingredients,
            'allergens' => $this->allergens,
            'image_url' => $this->image_url,
            'price_cents' => $this->price_cents,
            'compare_at_price_cents' => $this->compare_at_price_cents,
            'is_active' => $this->is_active,
            'is_new_arrival' => $this->is_new_arrival,
            'is_best_seller' => $this->is_best_seller,
            'is_budget' => $this->is_budget,
            'is_premium' => $this->is_premium,
            'is_featured' => $this->is_featured,
            'sort_order' => $this->sort_order,
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'add_ons' => AddOnResource::collection($this->whenLoaded('addOns')),
        ];
    }
}
