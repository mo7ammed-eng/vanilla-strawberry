<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TableRequest;
use App\Http\Resources\TableResource;
use App\Models\RestaurantTable;
use App\Models\TableSession;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class TableController extends Controller
{
    public function index(): JsonResponse
    {
        $tables = RestaurantTable::query()
            ->with(['sessions' => fn ($query) => $query->where('status', 'open')])
            ->withCount('orders')
            ->orderBy('zone')
            ->orderBy('name')
            ->get();

        return ApiResponse::success(TableResource::collection($tables), 'Tables loaded.');
    }

    public function store(TableRequest $request): JsonResponse
    {
        $table = RestaurantTable::create([
            ...$request->validated(),
            'token' => Str::random(40),
        ]);

        return ApiResponse::success(new TableResource($table->load('sessions')), 'Table created.', 201);
    }

    public function update(TableRequest $request, RestaurantTable $table): JsonResponse
    {
        $table->update($request->validated());

        return ApiResponse::success(new TableResource($table->load('sessions')), 'Table updated.');
    }

    public function regenerateToken(RestaurantTable $table): JsonResponse
    {
        $table->update(['token' => Str::random(40)]);

        return ApiResponse::success(new TableResource($table->load('sessions')), 'QR token regenerated. Old QR codes will stop working.');
    }

    public function closeSession(RestaurantTable $table): JsonResponse
    {
        $session = TableSession::query()
            ->where('table_id', $table->id)
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();

        if ($session !== null) {
            $session->update([
                'status' => 'closed',
                'closed_at' => now(),
                'closed_by' => request()->user()?->id,
            ]);
        }

        return ApiResponse::success(
            new TableResource($table->load(['sessions' => fn ($query) => $query->where('status', 'open')])),
            $session === null ? 'This table has no open session.' : 'Table session closed.',
        );
    }

    public function destroy(RestaurantTable $table): JsonResponse
    {
        if ($table->orders()->exists()) {
            $table->update(['is_active' => false]);

            return ApiResponse::success(null, 'Table archived because it has order history.');
        }

        $table->delete();

        return ApiResponse::success(null, 'Table deleted.');
    }
}
