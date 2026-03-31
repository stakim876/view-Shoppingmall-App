USE myshop;

ALTER TABLE products
  ADD INDEX IF NOT EXISTS idx_products_category_price (category, price);

ALTER TABLE orders
  ADD INDEX IF NOT EXISTS idx_orders_user_created (user_id, created_at);

ALTER TABLE wishlists
  ADD UNIQUE INDEX IF NOT EXISTS uq_wishlists_user_product (user_id, product_id);
