<?php

declare(strict_types=1);

use App\Http\Controllers\Api\Account\AddressController;
use App\Http\Controllers\Api\Account\NotificationController;
use App\Http\Controllers\Api\Account\OrderController as AccountOrderController;
use App\Http\Controllers\Api\Account\ReservationController as AccountReservationController;
use App\Http\Controllers\Api\Admin\AddOnController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\ChefController as AdminChefController;
use App\Http\Controllers\Api\Admin\CouponController as AdminCouponController;
use App\Http\Controllers\Api\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\GalleryController as AdminGalleryController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\ReservationController as AdminReservationController;
use App\Http\Controllers\Api\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Api\Admin\TableController as AdminTableController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\Chef\OrderController as ChefOrderController;
use App\Http\Controllers\Api\CouponValidationController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\QrTableController;
use App\Http\Controllers\Api\ReservationController;
use App\Models\Setting;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', HealthController::class);

    Route::middleware('throttle:public')->group(function (): void {
        Route::get('/home', HomeController::class);
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{product:slug}', [ProductController::class, 'show']);
        Route::get('/gallery', [GalleryController::class, 'index']);
        Route::get('/settings', fn () => response()->json(['data' => Setting::publicPayload(), 'message' => 'Settings loaded.']));

        Route::post('/coupons/validate', CouponValidationController::class);

        Route::get('/tables/{token}', [QrTableController::class, 'show']);
        Route::post('/tables/{token}/session', [QrTableController::class, 'startSession']);

        Route::get('/reservations/availability', [ReservationController::class, 'availability']);
        Route::post('/reservations', [ReservationController::class, 'store']);

        Route::post('/orders', [OrderController::class, 'store'])->middleware('throttle:orders');
        Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);
    });

    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/me', [AuthController::class, 'me']);
            Route::patch('/profile', [AuthController::class, 'updateProfile']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/account/orders', [AccountOrderController::class, 'index']);
        Route::get('/account/orders/{orderNumber}', [AccountOrderController::class, 'show']);
        Route::apiResource('/account/addresses', AddressController::class)->except(['show']);
        Route::get('/account/reservations', [AccountReservationController::class, 'index']);
        Route::patch('/account/reservations/{reservation}/cancel', [AccountReservationController::class, 'cancel']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

        Route::middleware('role:chef,admin')->prefix('chef')->group(function (): void {
            Route::get('/orders', [ChefOrderController::class, 'index']);
            Route::get('/orders/{orderNumber}', [ChefOrderController::class, 'show']);
            Route::patch('/orders/{order}/status', [ChefOrderController::class, 'updateStatus']);
        });

        Route::middleware('role:admin')->prefix('admin')->group(function (): void {
            Route::get('/dashboard', DashboardController::class);

            Route::apiResource('/categories', AdminCategoryController::class);
            Route::apiResource('/products', AdminProductController::class);
            Route::apiResource('/add-ons', AddOnController::class)->parameters(['add-ons' => 'addOn']);
            Route::apiResource('/coupons', AdminCouponController::class);
            Route::apiResource('/gallery', AdminGalleryController::class);

            Route::get('/orders', [AdminOrderController::class, 'index']);
            Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
            Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);

            Route::get('/customers', [AdminCustomerController::class, 'index']);
            Route::get('/customers/{customer}', [AdminCustomerController::class, 'show']);
            Route::patch('/customers/{customer}', [AdminCustomerController::class, 'update']);

            Route::get('/chefs', [AdminChefController::class, 'index']);
            Route::post('/chefs', [AdminChefController::class, 'store']);
            Route::patch('/chefs/{chef}', [AdminChefController::class, 'update']);

            Route::get('/tables', [AdminTableController::class, 'index']);
            Route::post('/tables', [AdminTableController::class, 'store']);
            Route::patch('/tables/{table}', [AdminTableController::class, 'update']);
            Route::delete('/tables/{table}', [AdminTableController::class, 'destroy']);
            Route::post('/tables/{table}/regenerate-token', [AdminTableController::class, 'regenerateToken']);
            Route::post('/tables/{table}/close-session', [AdminTableController::class, 'closeSession']);

            Route::get('/reservations', [AdminReservationController::class, 'index']);
            Route::patch('/reservations/{reservation}/status', [AdminReservationController::class, 'updateStatus']);

            Route::get('/settings', [AdminSettingsController::class, 'index']);
            Route::patch('/settings', [AdminSettingsController::class, 'update']);
        });
    });
});

Route::fallback(function () {
    return response()->json(['message' => 'Endpoint not found.', 'data' => null], 404);
})->prefix('v1');
