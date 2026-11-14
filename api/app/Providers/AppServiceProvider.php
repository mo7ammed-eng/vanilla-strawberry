<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        RateLimiter::for('api', fn (Request $request): Limit => Limit::perMinute(240)->by($request->ip()));

        RateLimiter::for('auth', fn (Request $request): Limit => Limit::perMinute(8)->by(mb_strtolower((string) $request->input('email')).'|'.$request->ip()));

        RateLimiter::for('orders', fn (Request $request): Limit => Limit::perMinute(20)->by($request->user('sanctum')?->id ?? $request->ip()));

        RateLimiter::for('public', fn (Request $request): Limit => Limit::perMinute(120)->by($request->ip()));
    }
}
