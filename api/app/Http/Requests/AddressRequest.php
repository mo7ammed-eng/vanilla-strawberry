<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'label' => ['sometimes', 'required', 'string', 'max:40'],
            'recipient_name' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'line1' => ['required', 'string', 'max:180'],
            'line2' => ['nullable', 'string', 'max:180'],
            'city' => ['required', 'string', 'max:120'],
            'postal_code' => ['required', 'string', 'max:24'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
