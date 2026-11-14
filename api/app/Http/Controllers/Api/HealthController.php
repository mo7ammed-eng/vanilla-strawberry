<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            DB::select('select 1');
            $database = 'connected';
            $status = 'ok';
            $code = 200;
        } catch (Throwable) {
            $database = 'unavailable';
            $status = 'degraded';
            $code = 503;
        }

        return response()->json([
            'data' => [
                'status' => $status,
                'service' => 'Vanilla & Strawberry API',
                'database' => $database,
                'time' => now()->toIso8601String(),
            ],
            'message' => $status === 'ok' ? 'API is healthy.' : 'API is running but the database is unavailable.',
        ], $code);
    }
}
