<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ReservationStatus;
use App\Enums\Role;
use App\Models\Reservation;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\ReservationCreatedNotification;
use App\Notifications\ReservationStatusChangedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ReservationService
{
    /** @return list<array{time: string, remaining: int}> */
    public function availability(string $date): array
    {
        $slots = Setting::get('reservation_slots', ['12:00', '12:30', '13:00', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']);
        $capacity = Setting::int('reservation_capacity_per_slot', 24);

        $booked = Reservation::query()
            ->whereDate('reservation_date', $date)
            ->whereIn('status', [ReservationStatus::Pending->value, ReservationStatus::Confirmed->value, ReservationStatus::Seated->value])
            ->selectRaw('reservation_time, SUM(party_size) as guests')
            ->groupBy('reservation_time')
            ->pluck('guests', 'reservation_time');

        $result = [];

        foreach ($slots as $slot) {
            $remaining = max(0, $capacity - (int) ($booked[$slot.':00'] ?? $booked[$slot] ?? 0));

            if ($date === today()->toDateString() && $slot <= now()->format('H:i')) {
                continue;
            }

            $result[] = ['time' => $slot, 'remaining' => $remaining];
        }

        return $result;
    }

    /** @param array<string, mixed> $data */
    public function create(array $data, ?User $user): Reservation
    {
        if (! Setting::bool(Setting::RESERVATIONS_ENABLED, true)) {
            throw ValidationException::withMessages([
                'reservation_date' => 'Reservations are currently closed.',
            ]);
        }

        return DB::transaction(function () use ($data, $user): Reservation {
            $capacity = Setting::int('reservation_capacity_per_slot', 24);

            $booked = Reservation::query()
                ->whereDate('reservation_date', $data['reservation_date'])
                ->where('reservation_time', $data['reservation_time'])
                ->whereIn('status', [ReservationStatus::Pending->value, ReservationStatus::Confirmed->value, ReservationStatus::Seated->value])
                ->lockForUpdate()
                ->sum('party_size');

            if ($booked + (int) $data['party_size'] > $capacity) {
                throw ValidationException::withMessages([
                    'reservation_time' => 'That seating time is fully booked. Please pick another time.',
                ]);
            }

            $reservation = Reservation::create([
                'reservation_code' => $this->generateCode(),
                'user_id' => $user?->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'reservation_date' => $data['reservation_date'],
                'reservation_time' => $data['reservation_time'],
                'party_size' => $data['party_size'],
                'status' => ReservationStatus::Pending,
                'notes' => $data['notes'] ?? null,
            ]);

            $admins = User::query()
                ->where('role', Role::Admin->value)
                ->where('is_active', true)
                ->get();

            Notification::send($admins, new ReservationCreatedNotification($reservation));

            return $reservation;
        });
    }

    public function updateStatus(Reservation $reservation, ReservationStatus $status): Reservation
    {
        if ($reservation->status === ReservationStatus::Cancelled && $status !== ReservationStatus::Cancelled) {
            throw ValidationException::withMessages([
                'status' => 'A cancelled reservation cannot be reopened.',
            ]);
        }

        $reservation->status = $status;
        $reservation->save();

        if ($reservation->user !== null) {
            $reservation->user->notify(new ReservationStatusChangedNotification($reservation));
        }

        return $reservation;
    }

    private function generateCode(): string
    {
        do {
            $code = 'RS-'.Str::upper(Str::random(6));
        } while (Reservation::query()->where('reservation_code', $code)->exists());

        return $code;
    }
}
