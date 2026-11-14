<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestaurantTable extends Model
{
    use HasFactory;

    protected $table = 'tables';

    protected $fillable = [
        'name',
        'zone',
        'capacity',
        'token',
        'is_active',
    ];

    protected $hidden = [
        'token',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TableSession::class, 'table_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_id');
    }

    public function activeSession(): ?TableSession
    {
        return $this->sessions()
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();
    }
}
