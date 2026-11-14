<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GalleryRequest;
use App\Http\Resources\GalleryItemResource;
use App\Models\GalleryItem;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class GalleryController extends Controller
{
    public function index(): JsonResponse
    {
        $items = GalleryItem::query()->orderBy('sort_order')->orderBy('id')->get();

        return ApiResponse::success(GalleryItemResource::collection($items), 'Gallery loaded.');
    }

    public function store(GalleryRequest $request): JsonResponse
    {
        $item = GalleryItem::create($request->validated());

        return ApiResponse::success(new GalleryItemResource($item), 'Gallery image added.', 201);
    }

    public function update(GalleryRequest $request, GalleryItem $gallery): JsonResponse
    {
        $gallery->update($request->validated());

        return ApiResponse::success(new GalleryItemResource($gallery), 'Gallery image updated.');
    }

    public function destroy(GalleryItem $gallery): JsonResponse
    {
        $gallery->delete();

        return ApiResponse::success(null, 'Gallery image deleted.');
    }
}
