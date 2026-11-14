<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\DiscountType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $coupon = $this->route('coupon');

        return [
            'code' => ['required', 'string', 'max:40', 'alpha_dash', Rule::unique('coupons', 'code')->ignore($coupon?->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'discount_type' => ['required', Rule::enum(DiscountType::class)],
            'value' => ['required', 'integer', 'min:1', 'max:1000000'],
            'min_order_cents' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'max_uses' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->input('discount_type') === DiscountType::Percentage->value && (int) $this->input('value') > 10000) {
                    $validator->errors()->add('value', 'Percentage discounts are stored in basis points and cannot exceed 100%.');
                }
            },
        ];
    }
}
