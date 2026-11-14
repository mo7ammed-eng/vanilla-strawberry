<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Account;

use App\Enums\ReservationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Services\ReservationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reservations = $request->user()->reservations()->latest('reservation_date')->get();

        return ApiResponse::success(ReservationResource::collection($reservations), 'Your reservations loaded.');
    }

    public function cancel(Request $request, Reservation $reservation, ReservationService $reservations): JsonResponse
    {
        abort_unless($reservation->user_id === $request->user()->id, 404);
        abort_unless(
            in_array($reservation->status, [ReservationStatus::Pending, ReservationStatus::Confirmed], true),
            422,
            'This reservation can no longer be cancelled.',
        );

        $reservation = $reservations->updateStatus($reservation, ReservationStatus::Cancelled);

        return ApiResponse::success(new ReservationResource($reservation), 'Reservation cancelled.');
    }
}
