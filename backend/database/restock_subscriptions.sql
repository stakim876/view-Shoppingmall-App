CREATE TABLE IF NOT EXISTS restock_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  notified_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_product_email (product_id, email),
  INDEX idx_product_notified (product_id, notified_at),
  CONSTRAINT fk_restock_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
