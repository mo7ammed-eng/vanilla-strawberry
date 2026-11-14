<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\ReservationStatus;
use App\Enums\Role;
use App\Models\AddOn;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\GalleryItem;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\RestaurantTable;
use App\Models\Setting;
use App\Models\TableSession;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = $this->seedUsers();
        $categories = $this->seedCategories();
        $addOns = $this->seedAddOns();
        $products = $this->seedProducts($categories, $addOns);
        $this->seedSettings();
        $tables = $this->seedTables();
        $this->seedCoupons();
        $this->seedGallery();
        $this->seedReservations($admin['customer']);
        $this->seedSampleOrders($products, $tables, $admin);
    }

    /** @return array{admin: User, chef: User, customer: User} */
    private function seedUsers(): array
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@vanillaandstrawberry.test'],
            ['name' => 'Ava Bennett', 'password' => 'VanillaAdmin!23', 'role' => Role::Admin, 'phone' => '(718) 555-0101', 'is_active' => true],
        );

        $chef = User::updateOrCreate(
            ['email' => 'chef@vanillaandstrawberry.test'],
            ['name' => 'Marco Rinaldi', 'password' => 'VanillaChef!23', 'role' => Role::Chef, 'phone' => '(718) 555-0102', 'is_active' => true],
        );

        $customer = User::updateOrCreate(
            ['email' => 'customer@vanillaandstrawberry.test'],
            ['name' => 'Maya Chen', 'password' => 'VanillaGuest!23', 'role' => Role::Customer, 'phone' => '(718) 555-0103', 'is_active' => true],
        );

        return ['admin' => $admin, 'chef' => $chef, 'customer' => $customer];
    }

    /** @return array<string, Category> */
    private function seedCategories(): array
    {
        $definitions = [
            'gelato' => [
                'name' => 'Gelato',
                'description' => 'Slow-churned, dense and silky, made in small batches every morning.',
                'image_url' => '/images/pistachio-rose.jpg',
                'sort_order' => 1,
            ],
            'sorbet' => [
                'name' => 'Sorbet',
                'description' => 'Fruit-forward and dairy-free, with a clean finish and vivid flavour.',
                'image_url' => '/images/lemon-basil.jpg',
                'sort_order' => 2,
            ],
            'sundaes' => [
                'name' => 'Sundaes',
                'description' => 'Layered desserts built for sharing, or not sharing at all.',
                'image_url' => '/images/strawberry-cloud.jpg',
                'sort_order' => 3,
            ],
        ];

        $categories = [];

        foreach ($definitions as $slug => $data) {
            $categories[$slug] = Category::updateOrCreate(['slug' => $slug], [...$data, 'is_active' => true]);
        }

        return $categories;
    }

    /** @return array<string, AddOn> */
    private function seedAddOns(): array
    {
        $definitions = [
            'strawberries' => ['name' => 'Fresh strawberries', 'price_cents' => 150, 'sort_order' => 1],
            'pistachio' => ['name' => 'Toasted pistachio', 'price_cents' => 175, 'sort_order' => 2],
            'fudge' => ['name' => 'Hot fudge', 'price_cents' => 125, 'sort_order' => 3],
            'coulis' => ['name' => 'Strawberry coulis', 'price_cents' => 100, 'sort_order' => 4],
            'cream' => ['name' => 'Whipped cream', 'price_cents' => 75, 'sort_order' => 5],
            'cone' => ['name' => 'Waffle cone', 'price_cents' => 100, 'sort_order' => 6],
        ];

        $addOns = [];

        foreach ($definitions as $key => $data) {
            $addOns[$key] = AddOn::updateOrCreate(['name' => $data['name']], [...$data, 'is_active' => true]);
        }

        return $addOns;
    }

    /**
     * @param  array<string, Category>  $categories
     * @param  array<string, AddOn>  $addOns
     * @return array<string, Product>
     */
    private function seedProducts(array $categories, array $addOns): array
    {
        $definitions = [
            [
                'slug' => 'strawberry-cloud',
                'category' => 'gelato',
                'name' => 'Strawberry Cloud',
                'short' => 'Roasted strawberries folded through sweet cream.',
                'description' => 'Our signature. Local strawberries are roasted with a little cane sugar, then rippled through a mascarpone cream base for a scoop that is bright, soft and quietly luxurious.',
                'ingredients' => 'Milk, cream, sugar, egg yolk, strawberries, mascarpone, lemon juice, sea salt.',
                'allergens' => 'Milk, egg.',
                'image' => 'strawberry-cloud.jpg',
                'price' => 750,
                'flags' => ['best', 'featured'],
                'add_ons' => ['strawberries', 'coulis', 'cream', 'cone'],
                'sort' => 1,
            ],
            [
                'slug' => 'madagascar-vanilla',
                'category' => 'gelato',
                'name' => 'Madagascar Vanilla',
                'short' => 'Single-origin vanilla, steeped overnight.',
                'description' => 'Whole vanilla beans steep in cream overnight before the base is churned. The result is floral, custardy and anything but plain.',
                'ingredients' => 'Milk, cream, sugar, egg yolk, Madagascar vanilla beans, sea salt.',
                'allergens' => 'Milk, egg.',
                'image' => 'vanilla-bean.jpg',
                'price' => 650,
                'flags' => ['best', 'featured'],
                'add_ons' => ['fudge', 'pistachio', 'cream', 'cone'],
                'sort' => 2,
            ],
            [
                'slug' => 'pistachio-rose',
                'category' => 'gelato',
                'name' => 'Pistachio & Rose',
                'short' => 'Sicilian pistachio with a whisper of rose.',
                'description' => 'We grind Bronte pistachios fresh for this scoop, then finish the base with a small amount of rose water. Nutty, delicate and unmistakably floral.',
                'ingredients' => 'Milk, cream, sugar, egg yolk, Sicilian pistachios, rose water, sea salt.',
                'allergens' => 'Milk, egg, pistachio.',
                'image' => 'pistachio-rose.jpg',
                'price' => 850,
                'flags' => ['premium', 'featured'],
                'add_ons' => ['pistachio', 'cream', 'cone'],
                'sort' => 3,
            ],
            [
                'slug' => 'salted-caramel-swirl',
                'category' => 'gelato',
                'name' => 'Salted Caramel Swirl',
                'short' => 'Burnt sugar caramel and flaked sea salt.',
                'description' => 'A deep, slow-cooked caramel is swirled through a clean cream base and finished with flaked sea salt. Rich, but never heavy.',
                'ingredients' => 'Milk, cream, sugar, egg yolk, butter, sea salt.',
                'allergens' => 'Milk, egg.',
                'image' => 'salted-caramel.jpg',
                'price' => 700,
                'flags' => ['best'],
                'add_ons' => ['fudge', 'pistachio', 'cream', 'cone'],
                'sort' => 4,
            ],
            [
                'slug' => 'dark-chocolate-sorbet',
                'category' => 'sorbet',
                'name' => 'Dark Chocolate Sorbet',
                'short' => 'Intense cocoa, no dairy, no compromise.',
                'description' => 'A water-based sorbet made with 72% single-origin chocolate. Deep, bittersweet and remarkably creamy without a drop of milk.',
                'ingredients' => 'Water, sugar, 72% dark chocolate, cocoa powder, glucose, sea salt.',
                'allergens' => 'May contain traces of milk.',
                'image' => 'chocolate-sorbet.jpg',
                'price' => 650,
                'flags' => ['budget'],
                'add_ons' => ['fudge', 'pistachio', 'cone'],
                'sort' => 5,
            ],
            [
                'slug' => 'lemon-basil-sorbet',
                'category' => 'sorbet',
                'name' => 'Lemon Basil Sorbet',
                'short' => 'Amalfi lemon with fresh garden basil.',
                'description' => 'Bright Amalfi lemon juice meets a basil-infused syrup for a sorbet that tastes like the first warm day of spring.',
                'ingredients' => 'Water, sugar, Amalfi lemon juice, lemon zest, fresh basil, sea salt.',
                'allergens' => 'None.',
                'image' => 'lemon-basil.jpg',
                'price' => 600,
                'flags' => ['new', 'budget'],
                'add_ons' => ['strawberries', 'cream', 'cone'],
                'sort' => 6,
            ],
            [
                'slug' => 'matcha-cream',
                'category' => 'gelato',
                'name' => 'Matcha Cream',
                'short' => 'Ceremonial matcha, whisked into cream.',
                'description' => 'Ceremonial-grade matcha gives this gelato a grassy, umami edge that is balanced by a generous amount of cream and a touch of honey.',
                'ingredients' => 'Milk, cream, sugar, egg yolk, ceremonial matcha, honey, sea salt.',
                'allergens' => 'Milk, egg.',
                'image' => 'matcha-cream.jpg',
                'price' => 800,
                'flags' => ['new'],
                'add_ons' => ['pistachio', 'cream', 'cone'],
                'sort' => 7,
            ],
            [
                'slug' => 'berry-ripple',
                'category' => 'gelato',
                'name' => 'Berry Ripple',
                'short' => 'Blackberry and raspberry ribbons.',
                'description' => 'A vanilla cream base rippled with a tart blackberry-raspberry compote. Every scoop is a little different, and that is the point.',
                'ingredients' => 'Milk, cream, sugar, egg yolk, blackberries, raspberries, lemon juice.',
                'allergens' => 'Milk, egg.',
                'image' => 'berry-ripple.jpg',
                'price' => 700,
                'flags' => [],
                'add_ons' => ['strawberries', 'coulis', 'cream', 'cone'],
                'sort' => 8,
            ],
            [
                'slug' => 'burnt-honey',
                'category' => 'gelato',
                'name' => 'Burnt Honey',
                'short' => 'Wildflower honey, lightly caramelised.',
                'description' => 'Wildflower honey is cooked just past golden to bring out a toasted, almost savoury note. Finished with a pinch of sea salt.',
                'ingredients' => 'Milk, cream, sugar, egg yolk, wildflower honey, sea salt.',
                'allergens' => 'Milk, egg.',
                'image' => 'burnt-honey.jpg',
                'price' => 850,
                'flags' => ['premium'],
                'add_ons' => ['pistachio', 'cream', 'cone'],
                'sort' => 9,
            ],
            [
                'slug' => 'coconut-lime',
                'category' => 'sorbet',
                'name' => 'Coconut Lime',
                'short' => 'Toasted coconut and fresh lime.',
                'description' => 'Coconut milk is toasted with lime zest, then churned into a dairy-free sorbet that is tropical without being sweet.',
                'ingredients' => 'Coconut milk, water, sugar, lime juice, lime zest, desiccated coconut, sea salt.',
                'allergens' => 'Coconut.',
                'image' => 'coconut-lime.jpg',
                'price' => 650,
                'flags' => ['best', 'budget'],
                'add_ons' => ['strawberries', 'cream', 'cone'],
                'sort' => 10,
            ],
            [
                'slug' => 'espresso-flake',
                'category' => 'gelato',
                'name' => 'Espresso Flake',
                'short' => 'Double espresso with dark chocolate shards.',
                'description' => 'A double shot of our house espresso is churned into a bittersweet cream base, then studded with thin shards of dark chocolate.',
                'ingredients' => 'Milk, cream, sugar, egg yolk, espresso, dark chocolate, cocoa, sea salt.',
                'allergens' => 'Milk, egg, soy.',
                'image' => 'espresso-flake.jpg',
                'price' => 750,
                'flags' => ['best'],
                'add_ons' => ['fudge', 'cream', 'cone'],
                'sort' => 11,
            ],
            [
                'slug' => 'fig-ricotta',
                'category' => 'gelato',
                'name' => 'Fig & Ricotta',
                'short' => 'Black mission figs and fresh ricotta.',
                'description' => 'Fresh ricotta gives this gelato a gentle tang, while black mission figs add jammy sweetness and a little texture.',
                'ingredients' => 'Milk, cream, sugar, ricotta, black mission figs, honey, lemon juice.',
                'allergens' => 'Milk.',
                'image' => 'fig-ricotta.jpg',
                'price' => 900,
                'flags' => ['premium', 'featured'],
                'add_ons' => ['pistachio', 'cream', 'cone'],
                'sort' => 12,
            ],
            [
                'slug' => 'strawberry-shortcake-sundae',
                'category' => 'sundaes',
                'name' => 'Strawberry Shortcake Sundae',
                'short' => 'Strawberry Cloud, shortcake, coulis, cream.',
                'description' => 'A generous scoop of Strawberry Cloud layered with buttery shortcake, macerated strawberries, strawberry coulis and softly whipped cream.',
                'ingredients' => 'Strawberry Cloud gelato, shortcake, strawberries, sugar, lemon juice, whipping cream.',
                'allergens' => 'Milk, egg, gluten.',
                'image' => 'strawberry-cloud.jpg',
                'price' => 1200,
                'flags' => ['best', 'premium', 'featured'],
                'add_ons' => ['strawberries', 'fudge', 'cream'],
                'sort' => 13,
                'sundae' => true,
            ],
            [
                'slug' => 'vanilla-bean-affogato',
                'category' => 'sundaes',
                'name' => 'Vanilla Bean Affogato',
                'short' => 'Madagascar Vanilla drowned in espresso.',
                'description' => 'A large scoop of Madagascar Vanilla in a chilled glass, finished at the table with a double shot of hot espresso.',
                'ingredients' => 'Madagascar Vanilla gelato, espresso.',
                'allergens' => 'Milk, egg.',
                'image' => 'vanilla-bean.jpg',
                'price' => 1050,
                'flags' => [],
                'add_ons' => ['fudge', 'pistachio', 'cream'],
                'sort' => 14,
                'sundae' => true,
            ],
        ];

        $products = [];

        foreach ($definitions as $definition) {
            $product = Product::updateOrCreate(
                ['slug' => $definition['slug']],
                [
                    'category_id' => $categories[$definition['category']]->id,
                    'name' => $definition['name'],
                    'short_description' => $definition['short'],
                    'description' => $definition['description'],
                    'ingredients' => $definition['ingredients'],
                    'allergens' => $definition['allergens'],
                    'image_url' => '/images/'.$definition['image'],
                    'price_cents' => $definition['price'],
                    'compare_at_price_cents' => null,
                    'is_active' => true,
                    'is_new_arrival' => in_array('new', $definition['flags'], true),
                    'is_best_seller' => in_array('best', $definition['flags'], true),
                    'is_budget' => in_array('budget', $definition['flags'], true),
                    'is_premium' => in_array('premium', $definition['flags'], true),
                    'is_featured' => in_array('featured', $definition['flags'], true),
                    'sort_order' => $definition['sort'],
                ],
            );

            $product->variants()->delete();

            if ($definition['sundae'] ?? false) {
                $variants = [
                    ['name' => 'Classic', 'price_delta_cents' => 0, 'is_default' => true],
                    ['name' => 'Large', 'price_delta_cents' => 400, 'is_default' => false],
                ];
            } else {
                $variants = [
                    ['name' => 'Single scoop', 'price_delta_cents' => 0, 'is_default' => true],
                    ['name' => 'Double scoop', 'price_delta_cents' => 250, 'is_default' => false],
                    ['name' => 'Pint', 'price_delta_cents' => 1200, 'is_default' => false],
                ];
            }

            foreach ($variants as $index => $variant) {
                $product->variants()->create([...$variant, 'is_active' => true, 'sort_order' => $index]);
            }

            $product->addOns()->sync(collect($definition['add_ons'])->map(fn (string $key): int => $addOns[$key]->id)->all());

            $products[$definition['slug']] = $product->fresh(['variants', 'addOns']);
        }

        return $products;
    }

    private function seedSettings(): void
    {
        $settings = [
            'restaurant_name' => 'Vanilla & Strawberry',
            'tagline' => 'Small-batch gelato, made slowly.',
            'address' => '14 Orchard Lane, Brooklyn, NY 11201',
            'phone' => '(718) 555-0142',
            'email' => 'hello@vanillaandstrawberry.test',
            'instagram' => '@vanillaandstrawberry',
            'map_url' => 'https://maps.google.com/?q=14+Orchard+Lane+Brooklyn+NY',
            'currency' => 'USD',
            'currency_symbol' => '$',
            'established_year' => 2018,
            'hours' => [
                ['day' => 'Monday', 'open' => '12:00', 'close' => '22:00'],
                ['day' => 'Tuesday', 'open' => '12:00', 'close' => '22:00'],
                ['day' => 'Wednesday', 'open' => '12:00', 'close' => '22:00'],
                ['day' => 'Thursday', 'open' => '12:00', 'close' => '22:00'],
                ['day' => 'Friday', 'open' => '12:00', 'close' => '23:00'],
                ['day' => 'Saturday', 'open' => '11:00', 'close' => '23:00'],
                ['day' => 'Sunday', 'open' => '11:00', 'close' => '21:00'],
            ],
            'tax_rate_bps' => 888,
            'service_fee_bps' => 0,
            'delivery_fee_cents' => 600,
            'free_delivery_threshold_cents' => 6000,
            'reservations_enabled' => true,
            'coupons_enabled' => true,
            'reservation_capacity_per_slot' => 24,
            'reservation_slots' => ['12:00', '12:30', '13:00', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
        ];

        foreach ($settings as $key => $value) {
            Setting::put($key, $value, in_array($key, ['reservations_enabled', 'coupons_enabled', 'tax_rate_bps', 'service_fee_bps', 'delivery_fee_cents', 'free_delivery_threshold_cents'], true) ? 'operations' : 'general');
        }
    }

    /** @return array<string, RestaurantTable> */
    private function seedTables(): array
    {
        $definitions = [
            ['name' => 'Garden 01', 'zone' => 'Garden', 'capacity' => 2],
            ['name' => 'Garden 02', 'zone' => 'Garden', 'capacity' => 4],
            ['name' => 'Window 03', 'zone' => 'Window', 'capacity' => 2],
            ['name' => 'Window 04', 'zone' => 'Window', 'capacity' => 4],
            ['name' => 'Parlour 05', 'zone' => 'Parlour', 'capacity' => 4],
            ['name' => 'Parlour 06', 'zone' => 'Parlour', 'capacity' => 6],
            ['name' => 'Terrace 07', 'zone' => 'Terrace', 'capacity' => 2],
            ['name' => 'Terrace 08', 'zone' => 'Terrace', 'capacity' => 4],
        ];

        $tables = [];

        foreach ($definitions as $definition) {
            $table = RestaurantTable::firstOrCreate(
                ['name' => $definition['name']],
                ['token' => Str::random(40), 'zone' => $definition['zone'], 'capacity' => $definition['capacity'], 'is_active' => true],
            );

            $table->update(['zone' => $definition['zone'], 'capacity' => $definition['capacity'], 'is_active' => true]);
            $tables[$definition['name']] = $table;
        }

        return $tables;
    }

    private function seedCoupons(): void
    {
        $definitions = [
            ['code' => 'STRAWBERRY10', 'description' => '10% off orders over $15.', 'discount_type' => 'percentage', 'value' => 1000, 'min_order_cents' => 1500, 'max_uses' => null],
            ['code' => 'SWEET5', 'description' => '$5 off orders over $25.', 'discount_type' => 'fixed', 'value' => 500, 'min_order_cents' => 2500, 'max_uses' => 200],
            ['code' => 'FIRSTSCOOP', 'description' => '15% off your first order over $20.', 'discount_type' => 'percentage', 'value' => 1500, 'min_order_cents' => 2000, 'max_uses' => 100],
        ];

        foreach ($definitions as $definition) {
            Coupon::updateOrCreate(
                ['code' => $definition['code']],
                [
                    ...$definition,
                    'starts_at' => now()->subDay(),
                    'ends_at' => now()->addYear(),
                    'is_active' => true,
                ],
            );
        }
    }

    private function seedGallery(): void
    {
        $items = [
            ['title' => 'The morning batch', 'caption' => 'Strawberry Cloud, fresh from the machine.', 'image_url' => '/images/strawberry-cloud.jpg', 'category' => 'kitchen'],
            ['title' => 'Vanilla beans', 'caption' => 'Split, steeped, never rushed.', 'image_url' => '/images/vanilla-bean.jpg', 'category' => 'ingredients'],
            ['title' => 'Pistachio & rose', 'caption' => 'Bronte pistachios, ground to order.', 'image_url' => '/images/pistachio-rose.jpg', 'category' => 'flavours'],
            ['title' => 'Salted caramel', 'caption' => 'Burnt sugar, flaked salt.', 'image_url' => '/images/salted-caramel.jpg', 'category' => 'flavours'],
            ['title' => 'Lemon & basil', 'caption' => 'A bright, dairy-free palate cleanser.', 'image_url' => '/images/lemon-basil.jpg', 'category' => 'flavours'],
            ['title' => 'The parlour', 'caption' => 'Warm light, marble tables, a little hush.', 'image_url' => '/images/fig-ricotta.jpg', 'category' => 'space'],
            ['title' => 'Fig season', 'caption' => 'Black mission figs, briefly available.', 'image_url' => '/images/fig-ricotta.jpg', 'category' => 'ingredients'],
            ['title' => 'After dinner', 'caption' => 'Espresso Flake and a quiet corner.', 'image_url' => '/images/espresso-flake.jpg', 'category' => 'moments'],
        ];

        foreach ($items as $index => $item) {
            GalleryItem::updateOrCreate(
                ['title' => $item['title']],
                [...$item, 'sort_order' => $index + 1, 'is_active' => true],
            );
        }
    }

    private function seedReservations(User $customer): void
    {
        Reservation::updateOrCreate(
            ['reservation_code' => 'RS-DEMO01'],
            [
                'user_id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone ?? '(718) 555-0103',
                'reservation_date' => today()->addDay()->toDateString(),
                'reservation_time' => '18:30',
                'party_size' => 2,
                'status' => ReservationStatus::Confirmed,
                'notes' => 'Window table if possible.',
            ],
        );

        Reservation::updateOrCreate(
            ['reservation_code' => 'RS-DEMO02'],
            [
                'user_id' => null,
                'name' => 'Jonah Ellis',
                'email' => 'jonah@example.com',
                'phone' => '(718) 555-0199',
                'reservation_date' => today()->addDays(2)->toDateString(),
                'reservation_time' => '19:00',
                'party_size' => 4,
                'status' => ReservationStatus::Pending,
                'notes' => 'Birthday — one candle, please.',
            ],
        );
    }

    /**
     * @param  array<string, Product>  $products
     * @param  array<string, RestaurantTable>  $tables
     * @param  array{admin: User, chef: User, customer: User}  $users
     */
    private function seedSampleOrders(array $products, array $tables, array $users): void
    {
        $orders = app(OrderService::class);

        $qrTable = $tables['Garden 01'];
        $session = TableSession::firstOrCreate(
            ['table_id' => $qrTable->id, 'status' => 'open'],
            ['token' => Str::random(48), 'opened_at' => now()],
        );

        $strawberry = $products['strawberry-cloud'];
        $strawberryDouble = $strawberry->variants->firstWhere('name', 'Double scoop');
        $strawberryExtras = $strawberry->addOns->whereIn('name', ['Fresh strawberries', 'Whipped cream'])->pluck('id')->all();

        $qrOrder = $orders->create([
            'items' => [[
                'product_id' => $strawberry->id,
                'variant_id' => $strawberryDouble?->id,
                'quantity' => 2,
                'add_on_ids' => $strawberryExtras,
            ]],
            'fulfillment_type' => 'dine_in',
            'customer_name' => 'Maya Chen',
            'customer_email' => 'maya@example.com',
            'customer_phone' => '(718) 555-0177',
            'table_session_token' => $session->token,
            'notes' => 'One spoon, please.',
            'payment_method' => 'pay_on_collection',
        ], $users['customer']);

        $qrOrder->forceFill(['placed_at' => now()->subMinutes(8)])->save();

        $espresso = $products['espresso-flake'];
        $affogato = $products['vanilla-bean-affogato'];

        $preparing = $orders->create([
            'items' => [
                [
                    'product_id' => $espresso->id,
                    'variant_id' => $espresso->variants->firstWhere('name', 'Single scoop')?->id,
                    'quantity' => 1,
                ],
                [
                    'product_id' => $affogato->id,
                    'variant_id' => $affogato->variants->firstWhere('name', 'Classic')?->id,
                    'quantity' => 1,
                ],
            ],
            'fulfillment_type' => 'pickup',
            'customer_name' => 'Lena Ortiz',
            'customer_email' => 'lena@example.com',
            'customer_phone' => '(718) 555-0188',
            'payment_method' => 'pay_on_collection',
        ], null);

        $preparing->forceFill(['placed_at' => now()->subMinutes(22)])->save();
        $orders->transition($preparing, OrderStatus::Confirmed, $users['chef']);
        $orders->transition($preparing->fresh(), OrderStatus::Preparing, $users['chef']);

        $fig = $products['fig-ricotta'];
        $honey = $products['burnt-honey'];

        $completed = $orders->create([
            'items' => [
                [
                    'product_id' => $fig->id,
                    'variant_id' => $fig->variants->firstWhere('name', 'Pint')?->id,
                    'quantity' => 1,
                ],
                [
                    'product_id' => $honey->id,
                    'variant_id' => $honey->variants->firstWhere('name', 'Double scoop')?->id,
                    'quantity' => 2,
                    'add_on_ids' => $honey->addOns->whereIn('name', ['Toasted pistachio'])->pluck('id')->all(),
                ],
            ],
            'fulfillment_type' => 'delivery',
            'customer_name' => 'Noah Patel',
            'customer_email' => 'noah@example.com',
            'customer_phone' => '(718) 555-0166',
            'delivery_address_line1' => '88 Willow Street',
            'delivery_address_line2' => 'Apt 4B',
            'delivery_city' => 'Brooklyn',
            'delivery_postal_code' => '11201',
            'delivery_latitude' => 40.6892,
            'delivery_longitude' => -73.9857,
            'payment_method' => 'pay_on_delivery',
            'notes' => 'Leave with the doorman if we are not home.',
        ], null);

        $orders->transition($completed, OrderStatus::Confirmed, $users['chef']);
        $orders->transition($completed->fresh(), OrderStatus::Preparing, $users['chef']);
        $orders->transition($completed->fresh(), OrderStatus::Ready, $users['chef']);
        $orders->transition($completed->fresh(), OrderStatus::Completed, $users['chef']);

        $completed->refresh()->forceFill([
            'placed_at' => today()->subDay()->setTime(19, 42),
            'completed_at' => today()->subDay()->setTime(20, 18),
        ])->save();

        $lemon = $products['lemon-basil-sorbet'];
        $matcha = $products['matcha-cream'];

        $pending = $orders->create([
            'items' => [
                [
                    'product_id' => $lemon->id,
                    'variant_id' => $lemon->variants->firstWhere('name', 'Double scoop')?->id,
                    'quantity' => 1,
                    'notes' => 'Extra lemon zest if possible.',
                ],
                [
                    'product_id' => $matcha->id,
                    'variant_id' => $matcha->variants->firstWhere('name', 'Single scoop')?->id,
                    'quantity' => 1,
                    'add_on_ids' => $matcha->addOns->whereIn('name', ['Whipped cream'])->pluck('id')->all(),
                ],
            ],
            'fulfillment_type' => 'pickup',
            'customer_name' => 'Priya Shah',
            'customer_email' => 'priya@example.com',
            'customer_phone' => '(718) 555-0144',
            'payment_method' => 'pay_on_collection',
        ], null);

        $pending->forceFill(['placed_at' => now()->subMinutes(3)])->save();
    }
}
