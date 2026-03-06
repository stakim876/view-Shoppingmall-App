-- ============================================================
-- 찜(위시리스트) 테이블
-- 로그인 사용자별로 상품을 찜할 수 있습니다.
-- ============================================================

USE myshop;

CREATE TABLE IF NOT EXISTS wishlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_product (user_id, product_id),
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'wishlists 테이블 생성 완료' AS result;
