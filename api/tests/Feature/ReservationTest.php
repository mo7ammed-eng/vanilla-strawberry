<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\ReservationStatus;
use App\Enums\Role;
use App\Models\Reservation;
use Tests\ShopTestCase;

class ReservationTest extends ShopTestCase
{
    /** @return array<string, mixed> */
    private function reservationPayload(int $partySize = 3): array
    {
        return [
            'name' => 'Reservation Guest',
            'email' => 'guest@example.test',
            'phone' => '555-0100',
            'reservation_date' => today()->addDay()->toDateString(),
            'reservation_time' => '18:00',
            'party_size' => $partySize,
        ];
    }

    public function test_reservations_are_capacity_checked_on_the_backend(): void
    {
        $this->setting('reservation_capacity_per_slot', 4);

        $this->postJson('/api/v1/reservations', $this->reservationPayload(3))->assertCreated();
        $this->postJson('/api/v1/reservations', $this->reservationPayload(2))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reservation_time');

        $this->assertDatabaseCount('reservations', 1);
    }

    public function test_availability_reports_remaining_seats(): void
    {
        $this->setting('reservation_capacity_per_slot', 4);
        Reservation::create([
            'reservation_code' => 'RS-TEST01',
            'name' => 'Guest',
            'email' => 'guest@example.test',
            'phone' => '555-0100',
            'reservation_date' => today()->addDay()->toDateString(),
            'reservation_time' => '18:00',
            'party_size' => 3,
            'status' => ReservationStatus::Confirmed,
        ]);

        $response = $this->getJson('/api/v1/reservations/availability?date='.today()->addDay()->toDateString())
            ->assertOk();

        $slot = collect($response->json('data'))->firstWhere('time', '18:00');
        $this->assertSame(1, $slot['remaining']);
    }

    public function test_reservations_are_rejected_when_the_feature_is_disabled(): void
    {
        $this->setting('reservations_enabled', false);

        $this->postJson('/api/v1/reservations', $this->reservationPayload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reservation_date');
    }

    public function test_a_customer_can_cancel_their_own_reservation(): void
    {
        $customer = $this->user(Role::Customer);
        $reservation = Reservation::create([
            'reservation_code' => 'RS-TEST02',
            'user_id' => $customer->id,
            'name' => 'Customer',
            'email' => $customer->email,
            'phone' => '555-0100',
            'reservation_date' => today()->addDay()->toDateString(),
            'reservation_time' => '19:00',
            'party_size' => 2,
            'status' => ReservationStatus::Confirmed,
        ]);

        $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/v1/account/reservations/{$reservation->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_a_customer_cannot_cancel_someone_elses_reservation(): void
    {
        $customer = $this->user(Role::Customer);
        $other = $this->user(Role::Customer);
        $reservation = Reservation::create([
            'reservation_code' => 'RS-TEST03',
            'user_id' => $other->id,
            'name' => 'Other Customer',
            'email' => $other->email,
            'phone' => '555-0100',
            'reservation_date' => today()->addDay()->toDateString(),
            'reservation_time' => '19:30',
            'party_size' => 2,
            'status' => ReservationStatus::Confirmed,
        ]);

        $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/v1/account/reservations/{$reservation->id}/cancel")
            ->assertNotFound();
    }
}
