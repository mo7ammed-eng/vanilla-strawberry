<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'active' => ['nullable', 'in:0,1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Product::query()->with(['category', 'variants', 'addOns']);

        if (! empty($validated['search'])) {
            $query->where('name', 'like', '%'.$validated['search'].'%');
        }

        if (! empty($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }

        if (isset($validated['active'])) {
            $query->where('is_active', $validated['active'] === '1');
        }

        $products = $query->orderBy('sort_order')->orderBy('name')
            ->paginate((int) ($validated['per_page'] ?? 24));

        return ApiResponse::success(
            ProductResource::collection($products->items()),
            'Products loaded.',
            200,
            ApiResponse::paginationMeta($products),
        );
    }

    public function store(ProductRequest $request): JsonResponse
    {
        $product = DB::transaction(function () use ($request): Product {
            $data = $request->validated();
            $variants = $data['variants'] ?? [['name' => 'Classic', 'price_delta_cents' => 0, 'is_default' => true, 'is_active' => true, 'sort_order' => 0]];
            $addOnIds = $data['add_on_ids'] ?? [];
            unset($data['variants'], $data['add_on_ids']);

            $product = Product::create($data);
            $this->syncVariants($product, $variants);
            $product->addOns()->sync($addOnIds);

            return $product;
        });

        return ApiResponse::success(
            new ProductResource($product->load(['category', 'variants', 'addOns'])),
            'Product created.',
            201,
        );
    }

    public function show(Product $product): JsonResponse
    {
        return ApiResponse::success(
            new ProductResource($product->load(['category', 'variants', 'addOns'])),
            'Product loaded.',
        );
    }

    public function update(ProductRequest $request, Product $product): JsonResponse
    {
        DB::transaction(function () use ($request, $product): void {
            $data = $request->validated();
            $variants = $data['variants'] ?? null;
            $addOnIds = $data['add_on_ids'] ?? null;
            unset($data['variants'], $data['add_on_ids']);

            $product->update($data);

            if ($variants !== null) {
                $this->syncVariants($product, $variants);
            }

            if ($addOnIds !== null) {
                $product->addOns()->sync($addOnIds);
            }
        });

        return ApiResponse::success(
            new ProductResource($product->fresh(['category', 'variants', 'addOns'])),
            'Product updated.',
        );
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->update(['is_active' => false]);

        return ApiResponse::success(null, 'Product archived. Existing orders are unaffected.');
    }

    /** @param list<array<string, mixed>> $variants */
    private function syncVariants(Product $product, array $variants): void
    {
        $keptIds = [];
        $hasDefault = false;

        foreach ($variants as $index => $variantData) {
            $variant = null;

            if (! empty($variantData['id'])) {
                $variant = $product->variants()->whereKey($variantData['id'])->first();

                if ($variant === null) {
                    throw ValidationException::withMessages([
                        "variants.$index.id" => 'This size does not belong to the product.',
                    ]);
                }
            }

            $values = [
                'name' => $variantData['name'],
                'price_delta_cents' => (int) $variantData['price_delta_cents'],
                'is_default' => (bool) ($variantData['is_default'] ?? false),
                'is_active' => (bool) ($variantData['is_active'] ?? true),
                'sort_order' => (int) ($variantData['sort_order'] ?? $index),
            ];

            $hasDefault = $hasDefault || $values['is_default'];

            if ($variant === null) {
                $variant = $product->variants()->create($values);
            } else {
                $variant->update($values);
            }

            $keptIds[] = $variant->id;
        }

        $product->variants()->whereNotIn('id', $keptIds)->delete();

        if (! $hasDefault) {
            $product->variants()->orderBy('sort_order')->first()?->update(['is_default' => true]);
        }
    }
}
