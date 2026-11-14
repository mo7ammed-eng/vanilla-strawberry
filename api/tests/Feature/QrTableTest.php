<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderSource;
use App\Enums\Role;
use App\Models\Order;
use App\Models\RestaurantTable;
use App\Models\TableSession;
use Illuminate\Support\Str;
use Tests\ShopTestCase;

class QrTableTest extends ShopTestCase
{
    public function test_scanning_a_qr_code_does_not_open_a_table_or_create_an_order(): void
    {
        $table = RestaurantTable::create([
            'name' => 'Garden 01',
            'zone' => 'Garden',
            'capacity' => 2,
            'token' => Str::random(40),
            'is_active' => true,
        ]);

        $this->getJson('/api/v1/tables/'.$table->token)
            ->assertOk()
            ->assertJsonPath('data.table.name', 'Garden 01')
            ->assertJsonPath('data.session', null);

        $this->assertDatabaseCount('table_sessions', 0);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_starting_a_table_session_is_explicit_and_idempotent(): void
    {
        RestaurantTable::create([
            'name' => 'Window 03',
            'zone' => 'Window',
            'capacity' => 2,
            'token' => 'valid-token',
            'is_active' => true,
        ]);

        $first = $this->postJson('/api/v1/tables/valid-token/session')
            ->assertCreated()
            ->assertJsonPath('data.table.name', 'Window 03');

        $second = $this->postJson('/api/v1/tables/valid-token/session')->assertCreated();

        $this->assertSame($first->json('data.session.token'), $second->json('data.session.token'));
        $this->assertDatabaseCount('table_sessions', 1);
    }

    public function test_an_inactive_table_cannot_be_opened(): void
    {
        RestaurantTable::create([
            'name' => 'Old Table',
            'capacity' => 2,
            'token' => 'inactive-token',
            'is_active' => false,
        ]);

        $this->getJson('/api/v1/tables/inactive-token')->assertNotFound();
        $this->postJson('/api/v1/tables/inactive-token/session')->assertNotFound();
    }

    public function test_a_qr_order_is_linked_to_the_table_session_and_forced_to_dine_in(): void
    {
        $catalog = $this->catalog();
        $table = RestaurantTable::create([
            'name' => 'Parlour 05',
            'zone' => 'Parlour',
            'capacity' => 4,
            'token' => Str::random(40),
            'is_active' => true,
        ]);
        $session = TableSession::create([
            'table_id' => $table->id,
            'token' => Str::random(48),
            'status' => 'open',
            'opened_at' => now(),
        ]);

        $this->postJson('/api/v1/orders', $this->orderPayload($catalog['product'], null, [
            'fulfillment_type' => 'pickup',
            'table_session_token' => $session->token,
        ]))
            ->assertCreated()
            ->assertJsonPath('data.source', 'qr')
            ->assertJsonPath('data.fulfillment_type', 'dine_in')
            ->assertJsonPath('data.table.name', 'Parlour 05')
            ->assertJsonPath('data.totals.delivery_fee_cents', 0);

        $order = Order::firstOrFail();
        $this->assertSame($session->id, $order->table_session_id);
        $this->assertSame($table->id, $order->table_id);
        $this->assertSame(OrderSource::Qr, $order->source);
    }

    public function test_an_ended_table_session_cannot_be_used_for_an_order(): void
    {
        $catalog = $this->catalog();
        $table = RestaurantTable::create([
            'name' => 'Closed Table',
            'capacity' => 2,
            'token' => Str::random(40),
            'is_active' => true,
        ]);
        $session = TableSession::create([
            'table_id' => $table->id,
            'token' => 'closed-session',
            'status' => 'closed',
            'opened_at' => now()->subHour(),
            'closed_at' => now(),
        ]);

        $this->postJson('/api/v1/orders', $this->orderPayload($catalog['product'], null, [
            'table_session_token' => $session->token,
        ]))->assertUnprocessable()->assertJsonValidationErrors('table_session_token');
    }

    public function test_an_admin_can_close_a_table_session(): void
    {
        $admin = $this->user(Role::Admin);
        $table = RestaurantTable::create([
            'name' => 'Terrace 07',
            'capacity' => 2,
            'token' => Str::random(40),
            'is_active' => true,
        ]);
        $session = TableSession::create([
            'table_id' => $table->id,
            'token' => Str::random(48),
            'status' => 'open',
            'opened_at' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/tables/'.$table->id.'/close-session')
            ->assertOk();

        $session->refresh();
        $this->assertSame('closed', $session->status);
        $this->assertSame($admin->id, $session->closed_by);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/tables/'.$table->id.'/close-session')
            ->assertOk();
    }
}
