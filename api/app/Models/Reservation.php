<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ReservationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_code',
        'user_id',
        'name',
        'email',
        'phone',
        'reservation_date',
        'reservation_time',
        'party_size',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'reservation_date' => 'date',
            'party_size' => 'integer',
            'status' => ReservationStatus::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
