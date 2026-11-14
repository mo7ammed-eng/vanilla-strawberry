<?php

declare(strict_types=1);

namespace Tests;

use App\Enums\Role;
use App\Models\AddOn;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

abstract class ShopTestCase extends TestCase
{
    use RefreshDatabase;

    protected function user(Role $role = Role::Customer, array $attributes = []): User
    {
        $suffix = Str::lower(Str::random(6));

        return User::create([
            'name' => $role->label().' '.$suffix,
            'email' => $role->value.'-'.$suffix.'@example.test',
            'password' => 'Password123!',
            'role' => $role,
            'is_active' => true,
            ...$attributes,
        ]);
    }

    /** @return array{category: Category, product: Product, default: ProductVariant, double: ProductVariant, addOn: AddOn} */
    protected function catalog(int $priceCents = 650): array
    {
        $category = Category::create([
            'name' => 'Gelato',
            'slug' => 'gelato',
            'description' => 'Churned daily.',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Test Strawberry',
            'slug' => 'test-strawberry',
            'short_description' => 'A test scoop.',
            'description' => 'A test scoop with enough detail for validation.',
            'image_url' => '/images/strawberry-cloud.jpg',
            'price_cents' => $priceCents,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $default = $product->variants()->create([
            'name' => 'Single scoop',
            'price_delta_cents' => 0,
            'is_default' => true,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $double = $product->variants()->create([
            'name' => 'Double scoop',
            'price_delta_cents' => 250,
            'is_default' => false,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $addOn = AddOn::create([
            'name' => 'Fresh strawberries',
            'price_cents' => 150,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $product->addOns()->attach($addOn->id);
        $product->load(['variants', 'addOns']);

        return [
            'category' => $category,
            'product' => $product,
            'default' => $default,
            'double' => $double,
            'addOn' => $addOn,
        ];
    }

    protected function setting(string $key, mixed $value): void
    {
        Setting::put($key, $value, str_contains($key, 'enabled') ? 'operations' : 'general');
    }

    /** @return array<string, mixed> */
    protected function orderPayload(Product $product, ?ProductVariant $variant = null, array $overrides = []): array
    {
        return [
            'items' => [[
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'quantity' => 1,
                'add_on_ids' => [],
            ]],
            'fulfillment_type' => 'pickup',
            'customer_name' => 'Test Guest',
            'customer_email' => 'guest@example.test',
            'customer_phone' => '555-0100',
            ...$overrides,
        ];
    }
}
