<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            ...$request->validated(),
            'role' => Role::Customer,
            'is_active' => true,
            'last_login_at' => now(),
        ]);

        $token = $user->createToken('web')->plainTextToken;

        return ApiResponse::success([
            'user' => new UserResource($user),
            'token' => $token,
        ], 'Welcome to Vanilla & Strawberry.', 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->string('email'))->first();

        if ($user === null || ! Hash::check($request->string('password')->toString(), $user->password)) {
            return ApiResponse::error('Those credentials do not match our records.', 401, [
                'email' => ['Those credentials do not match our records.'],
            ]);
        }

        if (! $user->is_active) {
            return ApiResponse::error('This account has been deactivated. Please speak with the restaurant team.', 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $token = $user->createToken($request->input('device_name', 'web'))->plainTextToken;

        return ApiResponse::success([
            'user' => new UserResource($user),
            'token' => $token,
        ], 'Welcome back.');
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success(new UserResource($request->user()), 'Profile loaded.');
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated())->save();

        return ApiResponse::success(new UserResource($user), 'Profile updated.');
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();
        $token?->delete();

        return ApiResponse::success(null, 'Signed out.');
    }
}
