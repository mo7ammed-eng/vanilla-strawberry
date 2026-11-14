<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ReservationStatusChangedNotification extends Notification
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
            'kind' => 'reservation_status',
            'title' => 'Reservation '.$this->reservation->status->label(),
            'body' => 'Your table for '.$this->reservation->party_size.' on '.$this->reservation->reservation_date->format('M j').' is '.$this->reservation->status->label().'.',
            'url' => '/reservations',
            'reservation_code' => $this->reservation->reservation_code,
            'status' => $this->reservation->status->value,
        ];
    }
}
