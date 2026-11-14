<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;

class OrderStatusService
{
    public function assertCanTransition(Order $order, OrderStatus $target, ?User $actor): void
    {
        if ($actor === null) {
            throw new AuthorizationException('You are not allowed to update this order.');
        }

        $allowed = $actor->isAdmin()
            ? $order->status->allowedAdminTransitions()
            : $order->status->nextForChef();

        if (! in_array($target, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => 'Order '.$order->order_number.' cannot move from '.$order->status->label().' to '.$target->label().'.',
            ]);
        }
    }
}
