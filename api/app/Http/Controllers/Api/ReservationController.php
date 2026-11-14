<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Services\ReservationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function availability(Request $request, ReservationService $reservations): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date', 'after_or_equal:today', 'before_or_equal:'.now()->addDays(60)->toDateString()],
        ]);

        return ApiResponse::success(
            $reservations->availability($validated['date']),
            'Reservation availability loaded.',
        );
    }

    public function store(StoreReservationRequest $request, ReservationService $reservations): JsonResponse
    {
        $reservation = $reservations->create($request->validated(), $request->user('sanctum'));

        return ApiResponse::success(new ReservationResource($reservation), 'Reservation request received.', 201);
    }
}
