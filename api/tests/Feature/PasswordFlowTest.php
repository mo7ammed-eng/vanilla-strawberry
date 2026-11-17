<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Role;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\ShopTestCase;

class PasswordFlowTest extends ShopTestCase
{
    public function test_registration_rejects_a_missing_or_mismatched_confirmation(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'No Confirmation',
            'email' => 'missing@example.test',
            'password' => 'Strawberry1',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Mismatch',
            'email' => 'mismatch@example.test',
            'password' => 'Strawberry1',
            'password_confirmation' => 'Strawberry2',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_registration_succeeds_with_a_matching_confirmation(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Confirmed Guest',
            'email' => 'confirmed@example.test',
            'password' => 'Strawberry1',
            'password_confirmation' => 'Strawberry1',
        ])->assertCreated()->assertJsonPath('data.user.email', 'confirmed@example.test');
    }

    public function test_a_customer_can_change_their_password(): void
    {
        $user = $this->user(Role::Customer, ['email' => 'change@example.test']);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/v1/auth/password', [
                'current_password' => 'Password123!',
                'password' => 'NewStrawberry2',
                'password_confirmation' => 'NewStrawberry2',
            ])
            ->assertOk()
            ->assertJsonStructure(['data' => ['token']]);

        $this->assertTrue(Hash::check('NewStrawberry2', $user->fresh()->password));
        $this->postJson('/api/v1/auth/login', [
            'email' => 'change@example.test',
            'password' => 'Password123!',
        ])->assertUnauthorized();
        $this->postJson('/api/v1/auth/login', [
            'email' => 'change@example.test',
            'password' => 'NewStrawberry2',
        ])->assertOk();
    }

    public function test_password_change_rejects_an_incorrect_current_password(): void
    {
        $user = $this->user(Role::Customer);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/v1/auth/password', [
                'current_password' => 'WrongPassword1',
                'password' => 'NewStrawberry2',
                'password_confirmation' => 'NewStrawberry2',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');

        $this->assertTrue(Hash::check('Password123!', $user->fresh()->password));
    }

    public function test_forgot_password_sends_a_notification_without_revealing_account_existence(): void
    {
        Notification::fake();
        $user = $this->user(Role::Customer, ['email' => 'reset@example.test']);

        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'reset@example.test']);
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'unknown@example.test']);

        $known->assertOk();
        $unknown->assertOk()->assertExactJson($known->json());
        Notification::assertSentTo($user, ResetPasswordNotification::class);
        Notification::assertNothingSentTo($this->user(Role::Customer, ['email' => 'unknown@example.test']));
    }

    public function test_password_can_be_reset_with_a_valid_token(): void
    {
        $user = $this->user(Role::Customer, ['email' => 'fresh@example.test']);
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'fresh@example.test',
            'password' => 'FreshStrawberry3',
            'password_confirmation' => 'FreshStrawberry3',
        ])->assertOk();

        $this->assertTrue(Hash::check('FreshStrawberry3', $user->fresh()->password));
        $this->postJson('/api/v1/auth/login', [
            'email' => 'fresh@example.test',
            'password' => 'Password123!',
        ])->assertUnauthorized();
    }

    public function test_reset_password_rejects_an_invalid_token(): void
    {
        $user = $this->user(Role::Customer, ['email' => 'invalid-token@example.test']);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'not-a-valid-token',
            'email' => $user->email,
            'password' => 'FreshStrawberry3',
            'password_confirmation' => 'FreshStrawberry3',
        ])->assertUnprocessable()->assertJsonValidationErrors('token');

        $this->assertTrue(Hash::check('Password123!', $user->fresh()->password));
    }
}
