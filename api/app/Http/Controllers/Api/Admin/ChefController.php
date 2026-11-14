<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ChefRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class ChefController extends Controller
{
    public function index(): JsonResponse
    {
        $chefs = User::query()
            ->where('role', Role::Chef->value)
            ->withCount('orders')
            ->orderBy('name')
            ->get();

        return ApiResponse::success(UserResource::collection($chefs), 'Chef accounts loaded.');
    }

    public function store(ChefRequest $request): JsonResponse
    {
        $chef = User::create([
            ...$request->validated(),
            'role' => Role::Chef,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return ApiResponse::success(new UserResource($chef), 'Chef account created.', 201);
    }

    public function update(ChefRequest $request, User $chef): JsonResponse
    {
        abort_unless($chef->role === Role::Chef, 404);

        $data = $request->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $chef->update($data);

        return ApiResponse::success(new UserResource($chef), 'Chef account updated.');
    }
}
