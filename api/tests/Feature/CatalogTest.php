<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Product;
use Tests\ShopTestCase;

class CatalogTest extends ShopTestCase
{
    public function test_the_product_list_only_returns_active_products(): void
    {
        $catalog = $this->catalog();

        Product::create([
            'category_id' => $catalog['category']->id,
            'name' => 'Hidden Flavour',
            'slug' => 'hidden-flavour',
            'short_description' => 'Not for sale.',
            'description' => 'Not for sale.',
            'image_url' => '/images/vanilla-bean.jpg',
            'price_cents' => 500,
            'is_active' => false,
        ]);

        $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'test-strawberry')
            ->assertJsonPath('meta.total', 1);
    }

    public function test_a_product_is_loaded_by_slug_with_variants_and_add_ons(): void
    {
        $this->catalog();

        $this->getJson('/api/v1/products/test-strawberry')
            ->assertOk()
            ->assertJsonPath('data.name', 'Test Strawberry')
            ->assertJsonCount(2, 'data.variants')
            ->assertJsonCount(1, 'data.add_ons');
    }

    public function test_categories_and_home_payload_are_available(): void
    {
        $this->catalog();

        $this->getJson('/api/v1/categories')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'gelato')
            ->assertJsonPath('data.0.products_count', 1);

        $this->getJson('/api/v1/home')
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['categories', 'products', 'collections' => ['new', 'best', 'budget', 'premium'], 'gallery', 'settings' => ['restaurant_name', 'tax_rate_bps']],
            ]);
    }

    public function test_product_search_filters_the_catalog(): void
    {
        $this->catalog();

        $this->getJson('/api/v1/products?search=strawberry')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/products?search=chocolate')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
