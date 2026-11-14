<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:32'],
            'reservation_date' => ['required', 'date', 'after_or_equal:today', 'before_or_equal:'.now()->addDays(60)->toDateString()],
            'reservation_time' => ['required', 'date_format:H:i'],
            'party_size' => ['required', 'integer', 'min:1', 'max:12'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
