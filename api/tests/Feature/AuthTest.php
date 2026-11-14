<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Tests\ShopTestCase;

class AuthTest extends ShopTestCase
{
    public function test_a_customer_can_register_and_receive_a_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'New Guest',
            'email' => 'new@example.test',
            'password' => 'Strawberry1',
            'password_confirmation' => 'Strawberry1',
            'phone' => '555-0111',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.role', 'customer')
            ->assertJsonStructure(['data' => ['user' => ['id', 'name', 'email'], 'token']]);

        $this->assertNotEmpty($response->json('data.token'));
        $this->assertArrayNotHasKey('password', $response->json('data.user'));
    }

    public function test_registration_rejects_a_duplicate_email(): void
    {
        $this->user(Role::Customer, ['email' => 'taken@example.test']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Another Guest',
            'email' => 'taken@example.test',
            'password' => 'Strawberry1',
            'password_confirmation' => 'Strawberry1',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_a_user_can_sign_in_and_read_their_profile(): void
    {
        $user = $this->user(Role::Chef, ['email' => 'chef@example.test']);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'chef@example.test',
            'password' => 'Password123!',
        ]);

        $login->assertOk()->assertJsonPath('data.user.id', $user->id);
        $token = $login->json('data.token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.role', 'chef');
    }

    public function test_an_inactive_account_cannot_sign_in(): void
    {
        $this->user(Role::Customer, [
            'email' => 'inactive@example.test',
            'is_active' => false,
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'inactive@example.test',
            'password' => 'Password123!',
        ])->assertForbidden();
    }

    public function test_customers_cannot_reach_admin_or_chef_areas(): void
    {
        $customer = $this->user(Role::Customer);

        $this->actingAs($customer, 'sanctum')->getJson('/api/v1/admin/dashboard')->assertForbidden();
        $this->actingAs($customer, 'sanctum')->getJson('/api/v1/chef/orders')->assertForbidden();
    }

    public function test_a_customer_can_update_their_profile(): void
    {
        $customer = $this->user(Role::Customer);

        $this->actingAs($customer, 'sanctum')
            ->patchJson('/api/v1/auth/profile', ['name' => 'Updated Name', 'phone' => '555-0199'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Name')
            ->assertJsonPath('data.phone', '555-0199');
    }
}
