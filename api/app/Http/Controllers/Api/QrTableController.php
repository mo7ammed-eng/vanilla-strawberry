<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use App\Models\TableSession;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class QrTableController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $table = RestaurantTable::query()
            ->with(['sessions' => fn ($query) => $query->where('status', 'open')->latest('opened_at')])
            ->where('token', $token)
            ->where('is_active', true)
            ->firstOrFail();

        $session = $table->sessions->first();

        return ApiResponse::success([
            'table' => [
                'name' => $table->name,
                'zone' => $table->zone,
                'capacity' => $table->capacity,
            ],
            'session' => $session === null ? null : [
                'token' => $session->token,
                'opened_at' => $session->opened_at?->toIso8601String(),
            ],
        ], $session === null ? 'Table is ready. Start your table order when you are seated.' : 'Table session is open.');
    }

    public function startSession(string $token): JsonResponse
    {
        $table = RestaurantTable::query()
            ->where('token', $token)
            ->where('is_active', true)
            ->firstOrFail();

        $session = TableSession::query()
            ->where('table_id', $table->id)
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();

        if ($session === null) {
            $session = TableSession::create([
                'table_id' => $table->id,
                'token' => Str::random(48),
                'status' => 'open',
                'opened_at' => now(),
            ]);
        }

        return ApiResponse::success([
            'table' => [
                'name' => $table->name,
                'zone' => $table->zone,
                'capacity' => $table->capacity,
            ],
            'session' => [
                'token' => $session->token,
                'opened_at' => $session->opened_at?->toIso8601String(),
            ],
        ], 'Table session started.', 201);
    }
}
