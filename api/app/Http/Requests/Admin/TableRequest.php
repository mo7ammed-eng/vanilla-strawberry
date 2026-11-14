<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class TableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'zone' => ['nullable', 'string', 'max:80'],
            'capacity' => ['required', 'integer', 'min:1', 'max:20'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
