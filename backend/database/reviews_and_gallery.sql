-- 리뷰 테이블 + 상품 이미지(갤러리) 테이블
-- MySQL에서 myshop DB 선택 후 실행하세요.

USE myshop;

-- 상품 추가 이미지 (갤러리용). 없으면 products.image_url 사용
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_id (product_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 구매 후기 (별점 + 한 줄 리뷰)
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL COMMENT '1~5',
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_id (product_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'reviews, product_images 테이블 생성 완료' AS result;
