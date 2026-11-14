<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()->orderByDesc('is_default')->latest()->get();

        return ApiResponse::success(AddressResource::collection($addresses), 'Addresses loaded.');
    }

    public function store(AddressRequest $request): JsonResponse
    {
        $address = DB::transaction(function () use ($request): Address {
            $user = $request->user();
            $isDefault = $request->boolean('is_default') || $user->addresses()->count() === 0;

            if ($isDefault) {
                $user->addresses()->update(['is_default' => false]);
            }

            return $user->addresses()->create([
                ...$request->validated(),
                'is_default' => $isDefault,
            ]);
        });

        return ApiResponse::success(new AddressResource($address), 'Address saved.', 201);
    }

    public function update(AddressRequest $request, Address $address): JsonResponse
    {
        abort_unless($address->user_id === $request->user()->id, 404);

        DB::transaction(function () use ($request, $address): void {
            if ($request->boolean('is_default')) {
                $request->user()->addresses()->update(['is_default' => false]);
            }

            $address->update($request->validated());
        });

        return ApiResponse::success(new AddressResource($address->fresh()), 'Address updated.');
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        abort_unless($address->user_id === $request->user()->id, 404);

        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $next = $request->user()->addresses()->latest()->first();
            $next?->update(['is_default' => true]);
        }

        return ApiResponse::success(null, 'Address removed.');
    }
}
