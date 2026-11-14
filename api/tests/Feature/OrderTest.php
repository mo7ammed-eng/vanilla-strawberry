<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Coupon;
use Tests\ShopTestCase;

class OrderTest extends ShopTestCase
{
    public function test_a_guest_can_place_an_order_with_server_calculated_totals(): void
    {
        $catalog = $this->catalog(650);
        $admin = $this->user(Role::Admin);
        $chef = $this->user(Role::Chef);

        $response = $this->postJson('/api/v1/orders', $this->orderPayload($catalog['product'], $catalog['double'], [
            'items' => [[
                'product_id' => $catalog['product']->id,
                'variant_id' => $catalog['double']->id,
                'quantity' => 2,
                'add_on_ids' => [$catalog['addOn']->id],
            ]],
        ]));

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.totals.subtotal_cents', 2100)
            ->assertJsonPath('data.totals.tax_cents', 186)
            ->assertJsonPath('data.totals.delivery_fee_cents', 0)
            ->assertJsonPath('data.totals.total_cents', 2286)
            ->assertJsonPath('data.items.0.add_ons.0.name', 'Fresh strawberries');

        $orderNumber = $response->json('data.order_number');
        $guestToken = $response->json('data.guest_token');

        $this->assertNotEmpty($guestToken);
        $this->assertStringStartsWith('VS-', $orderNumber);

        $this->getJson("/api/v1/orders/{$orderNumber}?token={$guestToken}")
            ->assertOk()
            ->assertJsonPath('data.order_number', $orderNumber);

        $this->getJson("/api/v1/orders/{$orderNumber}")->assertForbidden();

        $this->assertDatabaseCount('notifications', 2);
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $admin->id]);
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $chef->id]);
    }

    public function test_a_coupon_is_applied_to_the_authoritative_total(): void
    {
        $catalog = $this->catalog(650);

        Coupon::create([
            'code' => 'STRAWBERRY10',
            'description' => 'Ten percent off.',
            'discount_type' => 'percentage',
            'value' => 1000,
            'min_order_cents' => 1500,
            'times_used' => 0,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
            'is_active' => true,
        ]);

        $this->postJson('/api/v1/orders', $this->orderPayload($catalog['product'], $catalog['double'], [
            'items' => [[
                'product_id' => $catalog['product']->id,
                'variant_id' => $catalog['double']->id,
                'quantity' => 2,
                'add_on_ids' => [$catalog['addOn']->id],
            ]],
            'coupon_code' => 'strawberry10',
        ]))
            ->assertCreated()
            ->assertJsonPath('data.totals.subtotal_cents', 2100)
            ->assertJsonPath('data.totals.discount_cents', 210)
            ->assertJsonPath('data.totals.tax_cents', 168)
            ->assertJsonPath('data.totals.total_cents', 2058);

        $this->assertDatabaseHas('coupons', ['code' => 'STRAWBERRY10', 'times_used' => 1]);
    }

    public function test_coupons_are_rejected_when_the_feature_flag_is_off(): void
    {
        $catalog = $this->catalog();
        $this->setting('coupons_enabled', false);

        $this->postJson('/api/v1/coupons/validate', ['code' => 'STRAWBERRY10'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('coupon_code');
    }

    public function test_delivery_orders_require_an_address_and_charge_delivery(): void
    {
        $catalog = $this->catalog(3000);

        $this->postJson('/api/v1/orders', $this->orderPayload($catalog['product'], null, [
            'fulfillment_type' => 'delivery',
        ]))->assertUnprocessable()->assertJsonValidationErrors(['delivery_address_line1', 'delivery_city', 'delivery_postal_code']);

        $this->postJson('/api/v1/orders', $this->orderPayload($catalog['product'], null, [
            'fulfillment_type' => 'delivery',
            'delivery_address_line1' => '88 Willow Street',
            'delivery_city' => 'Brooklyn',
            'delivery_postal_code' => '11201',
        ]))
            ->assertCreated()
            ->assertJsonPath('data.fulfillment_type', 'delivery')
            ->assertJsonPath('data.totals.delivery_fee_cents', 600)
            ->assertJsonPath('data.payment_method', 'pay_on_delivery');
    }

    public function test_an_inactive_product_cannot_be_ordered(): void
    {
        $catalog = $this->catalog();
        $catalog['product']->update(['is_active' => false]);

        $this->postJson('/api/v1/orders', $this->orderPayload($catalog['product']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items.0.product_id');
    }
}
