<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordController extends Controller
{
    public function forgot(ForgotPasswordRequest $request): JsonResponse
    {
        Password::broker()->sendResetLink($request->only('email'), function (User $user, string $token): void {
            $user->notify(new ResetPasswordNotification($token));
        });

        return ApiResponse::success(null, 'If that email address has an account, a reset link is on its way.');
    }

    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::broker()->reset(
            $request->only('token', 'email', 'password', 'password_confirmation'),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();
                $user->tokens()->delete();
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return ApiResponse::error('This password reset link is invalid or has expired.', 422, [
                'token' => ['This password reset link is invalid or has expired.'],
            ]);
        }

        return ApiResponse::success(null, 'Your password has been reset. Please sign in.');
    }

    public function change(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->string('current_password')->toString(), $user->password)) {
            return ApiResponse::error('The current password is incorrect.', 422, [
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->forceFill(['password' => $request->string('password')->toString()])->save();
        $user->tokens()->delete();
        $token = $user->createToken('web')->plainTextToken;

        return ApiResponse::success(['token' => $token], 'Password updated.');
    }
}
