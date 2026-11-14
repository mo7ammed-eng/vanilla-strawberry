<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null || ! $user->is_active) {
            return response()->json(['message' => 'This account is not active.', 'data' => null], 403);
        }

        if (! in_array($user->role->value, $roles, true)) {
            return response()->json(['message' => 'You are not allowed to access this area.', 'data' => null], 403);
        }

        return $next($request);
    }
}
