<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Product;
use App\Models\RestaurantTable;
use App\Models\Setting;
use Illuminate\Support\Str;
use Tests\ShopTestCase;

class AdminTest extends ShopTestCase
{
    public function test_the_admin_dashboard_returns_operational_metrics(): void
    {
        $admin = $this->user(Role::Admin);
        $this->catalog();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'stats' => ['orders_today', 'active_orders', 'revenue_today_cents', 'customers', 'active_products', 'upcoming_reservations'],
                    'sales_last_7_days',
                    'top_products',
                    'recent_orders',
                ],
            ])
            ->assertJsonPath('data.stats.active_products', 1);
    }

    public function test_an_admin_can_create_a_product_with_variants_and_archive_it(): void
    {
        $admin = $this->user(Role::Admin);
        $catalog = $this->catalog();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/products', [
                'category_id' => $catalog['category']->id,
                'name' => 'New Pistachio',
                'slug' => 'new-pistachio',
                'short_description' => 'A new flavour.',
                'description' => 'A new flavour with a full description.',
                'image_url' => '/images/pistachio-rose.jpg',
                'price_cents' => 900,
                'is_active' => true,
                'is_new_arrival' => true,
                'variants' => [
                    ['name' => 'Single scoop', 'price_delta_cents' => 0, 'is_default' => true, 'is_active' => true, 'sort_order' => 0],
                    ['name' => 'Double scoop', 'price_delta_cents' => 250, 'is_default' => false, 'is_active' => true, 'sort_order' => 1],
                ],
                'add_on_ids' => [$catalog['addOn']->id],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.slug', 'new-pistachio')
            ->assertJsonCount(2, 'data.variants')
            ->assertJsonCount(1, 'data.add_ons');

        $product = Product::where('slug', 'new-pistachio')->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/v1/admin/products/'.$product->id)
            ->assertOk();

        $this->assertFalse($product->fresh()->is_active);
    }

    public function test_an_admin_can_create_a_chef_who_can_sign_in_to_the_kitchen(): void
    {
        $admin = $this->user(Role::Admin);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/chefs', [
                'name' => 'New Chef',
                'email' => 'new-chef@example.test',
                'phone' => '555-0122',
                'password' => 'ChefPassword1',
                'password_confirmation' => 'ChefPassword1',
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('data.role', 'chef');

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'new-chef@example.test',
            'password' => 'ChefPassword1',
        ])->assertOk();

        $token = $login->json('data.token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/chef/orders')
            ->assertOk();
    }

    public function test_an_admin_can_toggle_feature_settings_that_take_effect_server_side(): void
    {
        $admin = $this->user(Role::Admin);

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/v1/admin/settings', [
                'settings' => [
                    'reservations_enabled' => false,
                    'coupons_enabled' => false,
                    'tax_rate_bps' => 1000,
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.public.reservations_enabled', false)
            ->assertJsonPath('data.public.coupons_enabled', false)
            ->assertJsonPath('data.public.tax_rate_bps', 1000);

        $this->assertFalse(Setting::bool('reservations_enabled', true));
        $this->assertFalse(Setting::bool('coupons_enabled', true));

        $this->postJson('/api/v1/reservations', [
            'name' => 'Guest',
            'email' => 'guest@example.test',
            'phone' => '555-0100',
            'reservation_date' => today()->addDay()->toDateString(),
            'reservation_time' => '18:00',
            'party_size' => 2,
        ])->assertUnprocessable();
    }

    public function test_an_admin_can_manage_customers_and_regenerate_table_tokens(): void
    {
        $admin = $this->user(Role::Admin);
        $customer = $this->user(Role::Customer);
        $table = RestaurantTable::create([
            'name' => 'Garden 09',
            'capacity' => 2,
            'token' => Str::random(40),
            'is_active' => true,
        ]);
        $oldToken = $table->token;

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/v1/admin/customers/'.$customer->id, ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/tables/'.$table->id.'/regenerate-token')
            ->assertOk();

        $this->assertNotSame($oldToken, $table->fresh()->token);
        $this->getJson('/api/v1/tables/'.$oldToken)->assertNotFound();
    }

    public function test_a_chef_cannot_use_admin_endpoints(): void
    {
        $chef = $this->user(Role::Chef);

        $this->actingAs($chef, 'sanctum')
            ->getJson('/api/v1/admin/settings')
            ->assertForbidden();

        $this->actingAs($chef, 'sanctum')
            ->getJson('/api/v1/admin/dashboard')
            ->assertForbidden();
    }
}
