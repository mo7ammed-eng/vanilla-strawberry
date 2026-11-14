<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CouponRequest;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class CouponController extends Controller
{
    public function index(): JsonResponse
    {
        $coupons = Coupon::query()->latest()->get();

        return ApiResponse::success(CouponResource::collection($coupons), 'Coupons loaded.');
    }

    public function store(CouponRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['code'] = strtoupper($data['code']);

        $coupon = Coupon::create([
            ...$data,
            'times_used' => 0,
            'min_order_cents' => $data['min_order_cents'] ?? 0,
        ]);

        return ApiResponse::success(new CouponResource($coupon), 'Coupon created.', 201);
    }

    public function update(CouponRequest $request, Coupon $coupon): JsonResponse
    {
        $data = $request->validated();
        $data['code'] = strtoupper($data['code']);
        $coupon->update($data);

        return ApiResponse::success(new CouponResource($coupon), 'Coupon updated.');
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        if ($coupon->redemptions()->exists()) {
            $coupon->update(['is_active' => false]);

            return ApiResponse::success(null, 'Coupon deactivated because it has redemption history.');
        }

        $coupon->delete();

        return ApiResponse::success(null, 'Coupon deleted.');
    }
}
