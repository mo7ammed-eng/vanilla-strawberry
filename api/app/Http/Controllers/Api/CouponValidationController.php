<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CouponResource;
use App\Services\CouponService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponValidationController extends Controller
{
    public function __invoke(Request $request, CouponService $coupons): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:40'],
        ]);

        $coupon = $coupons->findAvailable($validated['code']);

        return ApiResponse::success(new CouponResource($coupon), 'Coupon is valid.');
    }
}
