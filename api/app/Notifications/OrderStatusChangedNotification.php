<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OrderStatusChangedNotification extends Notification
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
        return [
            'kind' => 'order_status',
            'title' => 'Order '.$this->order->order_number.' is '.$this->order->status->label(),
            'body' => 'We will keep you posted as your order moves along.',
            'url' => '/account/orders/'.$this->order->order_number,
            'order_number' => $this->order->order_number,
            'status' => $this->order->status->value,
        ];
    }
}
