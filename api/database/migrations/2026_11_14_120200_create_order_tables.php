<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tables', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('zone')->nullable();
            $table->unsignedInteger('capacity')->default(2);
            $table->string('token', 64)->unique();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('table_sessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('table_id')->constrained('tables')->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->string('status')->default('open')->index();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('coupons', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->string('discount_type');
            $table->unsignedInteger('value');
            $table->unsignedInteger('min_order_cents')->default(0);
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('times_used')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table): void {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('source')->default('online')->index();
            $table->string('fulfillment_type')->default('pickup')->index();
            $table->string('status')->default('pending')->index();
            $table->foreignId('table_id')->nullable()->constrained('tables')->nullOnDelete();
            $table->foreignId('table_session_id')->nullable()->constrained('table_sessions')->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('delivery_address_line1')->nullable();
            $table->string('delivery_address_line2')->nullable();
            $table->string('delivery_city')->nullable();
            $table->string('delivery_postal_code')->nullable();
            $table->decimal('delivery_latitude', 10, 7)->nullable();
            $table->decimal('delivery_longitude', 10, 7)->nullable();
            $table->unsignedInteger('subtotal_cents');
            $table->unsignedInteger('tax_cents')->default(0);
            $table->unsignedInteger('service_fee_cents')->default(0);
            $table->unsignedInteger('delivery_fee_cents')->default(0);
            $table->unsignedInteger('discount_cents')->default(0);
            $table->unsignedInteger('total_cents');
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->string('coupon_code')->nullable();
            $table->text('notes')->nullable();
            $table->string('payment_method')->default('pay_on_collection');
            $table->string('payment_status')->default('unpaid');
            $table->timestamp('placed_at')->index();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->string('guest_token', 64)->nullable()->unique();
            $table->timestamps();
            $table->index(['placed_at', 'status']);
        });

        Schema::create('order_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->string('variant_name')->nullable();
            $table->unsignedInteger('unit_price_cents');
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('line_total_cents');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('order_item_add_ons', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('add_on_id')->nullable();
            $table->string('name');
            $table->unsignedInteger('price_cents');
            $table->timestamps();
        });

        Schema::create('coupon_redemptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email')->nullable();
            $table->unsignedInteger('amount_cents');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupon_redemptions');
        Schema::dropIfExists('order_item_add_ons');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('table_sessions');
        Schema::dropIfExists('tables');
    }
};
