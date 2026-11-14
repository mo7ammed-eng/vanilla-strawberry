<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\GalleryItemResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\GalleryItem;
use App\Models\Product;
use App\Models\Setting;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->withCount(['products' => fn ($query) => $query->where('is_active', true)])
            ->orderBy('sort_order')
            ->get();

        $with = ['category', 'variants', 'addOns'];

        $products = Product::query()
            ->with($with)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->limit(8)
            ->get();

        $collections = [
            'new' => Product::query()->with($with)->active()->collection('new')->orderBy('sort_order')->limit(4)->get(),
            'best' => Product::query()->with($with)->active()->collection('best')->orderBy('sort_order')->limit(4)->get(),
            'budget' => Product::query()->with($with)->active()->collection('budget')->orderBy('price_cents')->limit(4)->get(),
            'premium' => Product::query()->with($with)->active()->collection('premium')->orderByDesc('price_cents')->limit(4)->get(),
        ];

        $gallery = GalleryItem::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->limit(8)
            ->get();

        return ApiResponse::success([
            'categories' => CategoryResource::collection($categories),
            'products' => ProductResource::collection($products),
            'collections' => array_map(
                static fn ($items) => ProductResource::collection($items),
                $collections,
            ),
            'gallery' => GalleryItemResource::collection($gallery),
            'settings' => Setting::publicPayload(),
        ], 'Homepage content loaded.');
    }
}
