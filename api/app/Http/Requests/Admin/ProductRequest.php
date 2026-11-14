<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:140'],
            'slug' => ['required', 'string', 'max:160', 'alpha_dash', Rule::unique('products', 'slug')->ignore($product?->id)],
            'short_description' => ['required', 'string', 'max:280'],
            'description' => ['required', 'string', 'max:2000'],
            'ingredients' => ['nullable', 'string', 'max:1000'],
            'allergens' => ['nullable', 'string', 'max:500'],
            'image_url' => ['required', 'string', 'max:500'],
            'price_cents' => ['required', 'integer', 'min:0', 'max:100000'],
            'compare_at_price_cents' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'is_active' => ['sometimes', 'boolean'],
            'is_new_arrival' => ['sometimes', 'boolean'],
            'is_best_seller' => ['sometimes', 'boolean'],
            'is_budget' => ['sometimes', 'boolean'],
            'is_premium' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:9999'],
            'variants' => ['sometimes', 'array', 'max:10'],
            'variants.*.id' => ['nullable', 'integer'],
            'variants.*.name' => ['required', 'string', 'max:80'],
            'variants.*.price_delta_cents' => ['required', 'integer', 'min:-10000', 'max:100000'],
            'variants.*.is_default' => ['sometimes', 'boolean'],
            'variants.*.is_active' => ['sometimes', 'boolean'],
            'variants.*.sort_order' => ['sometimes', 'integer', 'min:0', 'max:999'],
            'add_on_ids' => ['sometimes', 'array', 'max:20'],
            'add_on_ids.*' => ['integer', 'distinct', 'exists:add_ons,id'],
        ];
    }
}
