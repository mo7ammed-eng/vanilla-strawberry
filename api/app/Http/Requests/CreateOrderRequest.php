<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\FulfillmentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1', 'max:30'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:20'],
            'items.*.add_on_ids' => ['nullable', 'array', 'max:8'],
            'items.*.add_on_ids.*' => ['integer', 'distinct', 'exists:add_ons,id'],
            'items.*.notes' => ['nullable', 'string', 'max:200'],
            'fulfillment_type' => ['required', Rule::enum(FulfillmentType::class)],
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:32'],
            'delivery_address_line1' => ['required_if:fulfillment_type,delivery', 'nullable', 'string', 'max:180'],
            'delivery_address_line2' => ['nullable', 'string', 'max:180'],
            'delivery_city' => ['required_if:fulfillment_type,delivery', 'nullable', 'string', 'max:120'],
            'delivery_postal_code' => ['required_if:fulfillment_type,delivery', 'nullable', 'string', 'max:24'],
            'delivery_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'delivery_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'table_session_token' => ['nullable', 'string', 'max:64'],
            'coupon_code' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string', 'max:500'],
            'payment_method' => ['nullable', Rule::in(['pay_on_collection', 'pay_on_delivery'])],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $fulfillment = $this->input('fulfillment_type');

                if ($fulfillment !== FulfillmentType::Delivery->value && $this->input('payment_method') === 'pay_on_delivery') {
                    $validator->errors()->add('payment_method', 'Pay on delivery is only available for delivery orders.');
                }
            },
        ];
    }
}
