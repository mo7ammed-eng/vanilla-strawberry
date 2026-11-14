<?php

declare(strict_types=1);

namespace App\Enums;

enum OrderSource: string
{
    case Online = 'online';
    case Qr = 'qr';

    public function label(): string
    {
        return match ($this) {
            self::Online => 'Online order',
            self::Qr => 'QR table order',
        };
    }
}
