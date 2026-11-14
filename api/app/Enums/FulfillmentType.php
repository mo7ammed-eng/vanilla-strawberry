<?php

declare(strict_types=1);

namespace App\Enums;

enum FulfillmentType: string
{
    case Delivery = 'delivery';
    case Pickup = 'pickup';
    case DineIn = 'dine_in';

    public function label(): string
    {
        return match ($this) {
            self::Delivery => 'Delivery',
            self::Pickup => 'Pickup',
            self::DineIn => 'Dine in',
        };
    }
}
