<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Order;
use Tests\ShopTestCase;

class ChefOrderTest extends ShopTestCase
{
    public function test_the_kitchen_can_move_an_order_through_its_preparation_states(): void
    {
        $catalog = $this->catalog();
        $customer = $this->user(Role::Customer);
        $chef = $this->user(Role::Chef);

        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/orders', $this->orderPayload($catalog['product']))
            ->assertCreated();

        $order = Order::firstOrFail();

        $this->actingAs($chef, 'sanctum')
            ->patchJson("/api/v1/chef/orders/{$order->order_number}/status", ['status' => 'ready'])
            ->assertUnprocessable();

        foreach (['confirmed', 'preparing', 'ready', 'completed'] as $status) {
            $this->actingAs($chef, 'sanctum')
                ->patchJson("/api/v1/chef/orders/{$order->order_number}/status", ['status' => $status])
                ->assertOk()
                ->assertJsonPath('data.status', $status);
        }

        $order->refresh();
        $this->assertSame(OrderStatus::Completed, $order->status);
        $this->assertNotNull($order->completed_at);
    }

    public function test_a_chef_cannot_cancel_an_order(): void
    {
        $catalog = $this->catalog();
        $chef = $this->user(Role::Chef);

        $this->postJson('/api/v1/orders', $this->orderPayload($catalog['product']))->assertCreated();
        $order = Order::firstOrFail();

        $this->actingAs($chef, 'sanctum')
            ->patchJson("/api/v1/chef/orders/{$order->order_number}/status", [
                'status' => 'cancelled',
                'reason' => 'Out of stock',
            ])
            ->assertUnprocessable();
    }

    public function test_an_admin_can_cancel_an_order_and_keep_the_reason(): void
    {
        $catalog = $this->catalog();
        $admin = $this->user(Role::Admin);

        $this->postJson('/api/v1/orders', $this->orderPayload($catalog['product']))->assertCreated();
        $order = Order::firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/orders/{$order->order_number}/status", [
                'status' => 'cancelled',
                'reason' => 'Kitchen closed early',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.cancellation_reason', 'Kitchen closed early');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'cancelled',
            'cancellation_reason' => 'Kitchen closed early',
        ]);
    }

    public function test_the_kitchen_queue_reports_active_orders_and_counts(): void
    {
        $catalog = $this->catalog();
        $chef = $this->user(Role::Chef);

        foreach ([1, 2] as $index) {
            $this->postJson('/api/v1/orders', $this->orderPayload($catalog['product'], null, [
                'customer_name' => 'Guest '.$index,
            ]))->assertCreated();
        }

        $this->actingAs($chef, 'sanctum')
            ->getJson('/api/v1/chef/orders?scope=active')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.counts.pending', 2);
    }
}
