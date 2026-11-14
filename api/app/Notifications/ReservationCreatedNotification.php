<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ReservationCreatedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Reservation $reservation)
    {
    }

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'kind' => 'reservation_created',
            'title' => 'New reservation request',
            'body' => $this->reservation->name.' · '.$this->reservation->party_size.' guests · '.$this->reservation->reservation_date->format('M j').' at '.substr((string) $this->reservation->reservation_time, 0, 5),
            'url' => '/admin/reservations',
            'reservation_code' => $this->reservation->reservation_code,
        ];
    }
}
