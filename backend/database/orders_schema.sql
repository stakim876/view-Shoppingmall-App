-- 주문(orders) 및 주문상품(order_items) 테이블 생성
-- 배포 전 MySQL에서 이 스크립트를 실행하세요.

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  address VARCHAR(500) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'paid',
  imp_uid VARCHAR(100) DEFAULT NULL,
  merchant_uid VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
