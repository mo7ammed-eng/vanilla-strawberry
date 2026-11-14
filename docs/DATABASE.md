# Database Design Guidance

The exact schema must be derived from the existing code and business rules. Do not blindly replace an existing database.

## Likely entities
- users (role constrained to customer/chef/admin)
- customer_profiles / addresses (as needed)
- categories
- products
- product_images
- product_variants
- add_ons / product_add_ons
- carts / cart_items (if persisted)
- orders
- order_items
- order_item_add_ons
- tables
- table_sessions
- reservations
- coupons
- coupon_redemptions
- notifications
- reviews (if approved)
- system_settings / feature_settings
- gallery_items

## Data integrity
- Use foreign keys and appropriate indexes.
- Store money using integer minor units or a deliberate decimal representation.
- Snapshot product name, unit price, and selected options into order items so historical orders remain accurate after catalog edits.
- Use transactions for checkout and reservation allocation.
- Use secure random QR tokens; store hashes where appropriate.
- Enforce unique and valid state transitions.
- Never trust totals or discounts sent by the browser.

## Migrations
Create additive migrations where possible. Do not rewrite migrations that may have been deployed. Do not run destructive database commands without explicit approval.
