<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = User::query()
            ->where('role', Role::Customer->value)
            ->withCount('orders');

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('phone', 'like', '%'.$search.'%');
            });
        }

        $customers = $query->latest()->paginate((int) ($validated['per_page'] ?? 20));

        return ApiResponse::success(
            UserResource::collection($customers->items()),
            'Customers loaded.',
            200,
            ApiResponse::paginationMeta($customers),
        );
    }

    public function show(User $customer): JsonResponse
    {
        abort_unless($customer->role === Role::Customer, 404);

        $orders = $customer->orders()->with(['items.addOns', 'table'])->latest('placed_at')->limit(10)->get();

        return ApiResponse::success([
            'customer' => new UserResource($customer->loadCount('orders')),
            'recent_orders' => OrderResource::collection($orders),
        ], 'Customer loaded.');
    }

    public function update(Request $request, User $customer): JsonResponse
    {
        abort_unless($customer->role === Role::Customer, 404);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($customer->id)],
            'phone' => ['nullable', 'string', 'max:32'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $customer->update($validated);

        return ApiResponse::success(new UserResource($customer), 'Customer updated.');
    }
}
