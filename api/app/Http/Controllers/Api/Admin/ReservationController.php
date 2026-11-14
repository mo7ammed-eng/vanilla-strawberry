<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateReservationStatusRequest;
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
        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'date' => ['nullable', 'date'],
            'search' => ['nullable', 'string', 'max:120'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Reservation::query();

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (! empty($validated['date'])) {
            $query->whereDate('reservation_date', $validated['date']);
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('reservation_code', 'like', '%'.$search.'%');
            });
        }

        $reservations = $query->orderBy('reservation_date')->orderBy('reservation_time')
            ->paginate((int) ($validated['per_page'] ?? 30));

        return ApiResponse::success(
            ReservationResource::collection($reservations->items()),
            'Reservations loaded.',
            200,
            ApiResponse::paginationMeta($reservations),
        );
    }

    public function updateStatus(UpdateReservationStatusRequest $request, Reservation $reservation, ReservationService $reservations): JsonResponse
    {
        $reservation = $reservations->updateStatus($reservation, \App\Enums\ReservationStatus::from($request->validated('status')));

        return ApiResponse::success(new ReservationResource($reservation), 'Reservation updated.');
    }
}
