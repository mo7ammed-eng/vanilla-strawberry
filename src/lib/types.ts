export type UserRole = "customer" | "chef" | "admin";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderSource = "online" | "qr";
export type FulfillmentType = "delivery" | "pickup" | "dine_in";
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled";
export type DiscountType = "percentage" | "fixed";

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  unread_count?: number;
  counts?: Record<string, number>;
}

export interface ApiEnvelope<T> {
  data: T;
  message: string;
  meta?: PaginationMeta;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  role_label: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string | null;
  orders_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  products_count?: number;
}

export interface ProductVariant {
  id: number;
  name: string;
  price_delta_cents: number;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface AddOn {
  id: number;
  name: string;
  price_cents: number;
  is_active: boolean;
  sort_order: number;
}

export interface Product {
  id: number;
  category_id: number;
  category?: Category;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  ingredients: string | null;
  allergens: string | null;
  image_url: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  is_active: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_budget: boolean;
  is_premium: boolean;
  is_featured: boolean;
  sort_order: number;
  variants: ProductVariant[];
  add_ons: AddOn[];
}

export interface WeekdayHours {
  day: string;
  open: string;
  close: string;
}

export interface PublicSettings {
  restaurant_name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  hours: WeekdayHours[];
  map_url: string;
  instagram: string;
  established_year: number;
  currency: string;
  currency_symbol: string;
  tax_rate_bps: number;
  service_fee_bps: number;
  delivery_fee_cents: number;
  free_delivery_threshold_cents: number;
  reservations_enabled: boolean;
  coupons_enabled: boolean;
  reservation_capacity_per_slot: number;
}

export interface HomePayload {
  categories: Category[];
  products: Product[];
  collections: {
    new: Product[];
    best: Product[];
    budget: Product[];
    premium: Product[];
  };
  gallery: GalleryItem[];
  settings: PublicSettings;
}

export interface GalleryItem {
  id: number;
  title: string;
  caption: string | null;
  image_url: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface CartAddOn {
  id: number;
  name: string;
  price_cents: number;
}

export interface CartLine {
  key: string;
  productId: number;
  slug: string;
  name: string;
  imageUrl: string;
  variantId: number | null;
  variantName: string | null;
  basePriceCents: number;
  variantDeltaCents: number;
  addOns: CartAddOn[];
  quantity: number;
  notes: string;
}

export interface OrderTotals {
  subtotal_cents: number;
  tax_cents: number;
  service_fee_cents: number;
  delivery_fee_cents: number;
  discount_cents: number;
  total_cents: number;
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  variant_id: number | null;
  variant_name: string | null;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
  notes: string | null;
  add_ons: { id: number; add_on_id: number | null; name: string; price_cents: number }[];
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  status_label: string;
  source: OrderSource;
  source_label: string;
  fulfillment_type: FulfillmentType;
  fulfillment_label: string;
  customer: { name: string; email: string | null; phone: string | null };
  delivery_address: {
    line1: string;
    line2: string | null;
    city: string;
    postal_code: string;
    latitude: string | null;
    longitude: string | null;
  } | null;
  table: { id: number; name: string; zone: string | null } | null;
  table_session_id: number | null;
  items: OrderItem[];
  totals: OrderTotals;
  coupon_code: string | null;
  notes: string | null;
  payment_method: string;
  payment_status: string;
  placed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  available_statuses: OrderStatus[];
  created_at: string | null;
  guest_token?: string;
}

export interface Address {
  id: number;
  label: string;
  recipient_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  postal_code: string;
  latitude: string | null;
  longitude: string | null;
  is_default: boolean;
}

export interface Reservation {
  id: number;
  reservation_code: string;
  name: string;
  email: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: ReservationStatus;
  status_label: string;
  notes: string | null;
  created_at: string | null;
}

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  value: number;
  display_value: string;
  min_order_cents: number;
  max_uses: number | null;
  times_used: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  is_available: boolean;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string | null;
}

export interface QrTable {
  table: { name: string; zone: string | null; capacity: number };
  session: { token: string; opened_at: string | null } | null;
}

export interface ReservationSlot {
  time: string;
  remaining: number;
}

export interface DashboardData {
  stats: {
    orders_today: number;
    active_orders: number;
    revenue_today_cents: number;
    revenue_yesterday_cents: number;
    customers: number;
    active_products: number;
    upcoming_reservations: number;
  };
  sales_last_7_days: { date: string; total_cents: number }[];
  top_products: { product_name: string; quantity: number; revenue_cents: number }[];
  recent_orders: Order[];
}

export interface AdminTable {
  id: number;
  name: string;
  zone: string | null;
  capacity: number;
  token: string;
  is_active: boolean;
  qr_url: string;
  active_session: { id: number; token: string; opened_at: string | null } | null;
  orders_count?: number;
}

export interface ChefSummary {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  role_label: string;
  is_active: boolean;
  orders_count?: number;
}
