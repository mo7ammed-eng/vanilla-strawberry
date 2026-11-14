<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label')->default('Home');
            $table->string('recipient_name');
            $table->string('phone')->nullable();
            $table->string('line1');
            $table->string('line2')->nullable();
            $table->string('city');
            $table->string('postal_code');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        Schema::create('reservations', function (Blueprint $table): void {
            $table->id();
            $table->string('reservation_code')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('phone');
            $table->date('reservation_date');
            $table->time('reservation_time');
            $table->unsignedInteger('party_size');
            $table->string('status')->default('pending')->index();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['reservation_date', 'reservation_time', 'status']);
        });

        Schema::create('gallery_items', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('caption')->nullable();
            $table->string('image_url');
            $table->string('category')->nullable()->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->string('group')->default('general')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('gallery_items');
        Schema::dropIfExists('reservations');
        Schema::dropIfExists('addresses');
    }
};
