<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ChefRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $chef = $this->route('chef');
        $creating = $this->isMethod('post');

        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($chef?->id)],
            'phone' => ['nullable', 'string', 'max:32'],
            'password' => [$creating ? 'required' : 'sometimes', 'confirmed', Password::min(8)->letters()->numbers()],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
