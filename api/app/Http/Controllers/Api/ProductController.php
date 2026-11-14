<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => ['nullable', 'string', 'max:120'],
            'collection' => ['nullable', 'in:new,best,budget,premium,featured'],
            'search' => ['nullable', 'string', 'max:120'],
            'sort' => ['nullable', 'in:recommended,price_asc,price_desc,newest'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
        ]);

        $query = Product::query()
            ->with(['category', 'variants', 'addOns'])
            ->where('is_active', true);

        if (! empty($validated['category'])) {
            $query->whereHas('category', fn ($builder) => $builder->where('slug', $validated['category'])->where('is_active', true));
        }

        if (! empty($validated['collection'])) {
            $query->collection($validated['collection']);
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', '%'.$search.'%')
                    ->orWhere('short_description', 'like', '%'.$search.'%')
                    ->orWhere('description', 'like', '%'.$search.'%');
            });
        }

        match ($validated['sort'] ?? 'recommended') {
            'price_asc' => $query->orderBy('price_cents'),
            'price_desc' => $query->orderByDesc('price_cents'),
            'newest' => $query->orderByDesc('created_at'),
            default => $query->orderBy('sort_order')->orderBy('name'),
        };

        $products = $query->paginate((int) ($validated['per_page'] ?? 12))->withQueryString();

        return ApiResponse::success(
            ProductResource::collection($products->items()),
            'Products loaded.',
            200,
            ApiResponse::paginationMeta($products),
        );
    }

    public function show(Product $product): JsonResponse
    {
        abort_unless($product->is_active, 404);

        $product->load(['category', 'variants', 'addOns']);

        return ApiResponse::success(new ProductResource($product), 'Product loaded.');
    }
}
