<?php

declare(strict_types=1);

namespace App\Enums;

enum Role: string
{
    case Customer = 'customer';
    case Chef = 'chef';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Customer => 'Customer',
            self::Chef => 'Chef',
            self::Admin => 'Administrator',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $role): string => $role->value, self::cases());
    }
}
