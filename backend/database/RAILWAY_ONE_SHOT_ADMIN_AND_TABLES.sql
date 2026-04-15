USE `railway`;

INSERT INTO users (email, password, name, gender, role)
VALUES (
  'admin@myshop.com',
  '$2b$10$FvkvN5FvXJoPMoT57z3T9u8fVvPpK87JFid2Ct35qXyNruqVCp0cG',
  '관리자',
  'male',
  'admin'
) AS new_row
ON DUPLICATE KEY UPDATE
  password = new_row.password,
  role = new_row.role;

CREATE TABLE IF NOT EXISTS notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  priority INT NOT NULL DEFAULT 0,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_public (is_active, starts_at, ends_at),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
