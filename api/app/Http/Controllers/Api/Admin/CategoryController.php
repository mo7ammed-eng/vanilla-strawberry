<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->withCount('products')
            ->orderBy('sort_order')
            ->get();

        return ApiResponse::success(CategoryResource::collection($categories), 'Categories loaded.');
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated());

        return ApiResponse::success(new CategoryResource($category), 'Category created.', 201);
    }

    public function show(Category $category): JsonResponse
    {
        return ApiResponse::success(new CategoryResource($category->loadCount('products')), 'Category loaded.');
    }

    public function update(CategoryRequest $request, Category $category): JsonResponse
    {
        $category->update($request->validated());

        return ApiResponse::success(new CategoryResource($category), 'Category updated.');
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return ApiResponse::error('Move or archive this category\'s products before deleting it.', 422);
        }

        $category->delete();

        return ApiResponse::success(null, 'Category deleted.');
    }
}
