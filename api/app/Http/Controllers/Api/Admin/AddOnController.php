<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AddOnRequest;
use App\Http\Resources\AddOnResource;
use App\Models\AddOn;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class AddOnController extends Controller
{
    public function index(): JsonResponse
    {
        $addOns = AddOn::query()->orderBy('sort_order')->orderBy('name')->get();

        return ApiResponse::success(AddOnResource::collection($addOns), 'Add-ons loaded.');
    }

    public function store(AddOnRequest $request): JsonResponse
    {
        $addOn = AddOn::create($request->validated());

        return ApiResponse::success(new AddOnResource($addOn), 'Add-on created.', 201);
    }

    public function update(AddOnRequest $request, AddOn $addOn): JsonResponse
    {
        $addOn->update($request->validated());

        return ApiResponse::success(new AddOnResource($addOn), 'Add-on updated.');
    }

    public function destroy(AddOn $addOn): JsonResponse
    {
        $addOn->products()->detach();
        $addOn->delete();

        return ApiResponse::success(null, 'Add-on deleted.');
    }
}
