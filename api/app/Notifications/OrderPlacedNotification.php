<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OrderPlacedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Order $order)
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
        $source = $this->order->source->value === 'qr'
            ? 'Table '.($this->order->table?->name ?? 'QR')
            : ucfirst($this->order->fulfillment_type->value);

        return [
            'kind' => 'order_placed',
            'title' => 'New order '.$this->order->order_number,
            'body' => $source.' · '.$this->order->customer_name.' · $'.number_format($this->order->total_cents / 100, 2),
            'url' => '/chef/orders/'.$this->order->order_number,
            'order_number' => $this->order->order_number,
            'status' => $this->order->status->value,
            'source' => $this->order->source->value,
            'total_cents' => $this->order->total_cents,
        ];
    }
}
