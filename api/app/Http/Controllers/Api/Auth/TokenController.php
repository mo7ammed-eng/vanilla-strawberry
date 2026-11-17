<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TokenController extends Controller
{
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        $current = $user->currentAccessToken();
        $token = $user->createToken($current?->name ?? 'web')->plainTextToken;
        $current?->delete();

        return ApiResponse::success(['token' => $token], 'Session refreshed.');
    }
}
