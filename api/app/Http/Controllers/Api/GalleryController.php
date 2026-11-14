<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GalleryItemResource;
use App\Models\GalleryItem;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class GalleryController extends Controller
{
    public function index(): JsonResponse
    {
        $items = GalleryItem::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return ApiResponse::success(GalleryItemResource::collection($items), 'Gallery loaded.');
    }
}
