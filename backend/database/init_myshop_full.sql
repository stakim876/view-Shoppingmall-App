-- ============================================================
-- MY Shop DB 통합 초기화 (시드 데이터 포함)
-- 로그인: shgy0673@naver.com / dpdpfmv770@! (비밀번호는 bcrypt 해시로 저장됨)
-- ============================================================

CREATE DATABASE IF NOT EXISTS myshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE myshop;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  gender ENUM('male', 'female', 'other'),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (email, password, name, gender, role)
VALUES
('shgy0673@naver.com', '$2b$10$.CZLXSXKm.hZ1bVGmvdVq.tDCDN3v3VK1fRoRG8AM5Fkoq7YwAqqW', '김승태', 'male', 'user'),
('admin@myshop.com', '$2b$10$qK8CY.gDHwFT2wGA6eRa/eR13CU8WEb.NS0FEQmy7Oau9kLCjzdE2', '관리자', 'male', 'admin');

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  category VARCHAR(100),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO products (name, description, price, stock, category, image_url) VALUES
('아이폰 15', '최신 아이폰 모델', 1500000, 10, '디지털/가전', '/images/iphone15.jpg'),
('맥북 프로', 'Apple M2 Pro 칩셋 탑재', 2800000, 5, '디지털/가전', '/images/macbookpro.jpg'),
('에어팟 프로', '노이즈 캔슬링 무선 이어폰', 350000, 30, '악세서리', '/images/airpodspro.jpg'),
('애플워치 9', '건강 모니터링 기능 강화', 650000, 20, '디지털/가전', '/images/applewatch.png'),
('아이패드 프로', 'M2 칩 탑재 아이패드', 1400000, 8, '디지털/가전', '/images/ipadpro.png'),
('뉴발란스 파스텔 스니커즈', '라벤더와 코랄 포인트의 캐주얼 스니커즈.', 13000, 30, '패션잡화', '/images/linda-xu-fUEP0djb1hA-unsplash.jpg'),
('데님 자켓 & 니트 비니', '라이트 워싱 데님 자켓과 포레스트 그린 리브드 비니.', 59000, 20, '의류', '/images/jordan-whitfield-Lprffwrv9cY-unsplash.jpg'),
('미니멀 백팩', '심플한 디자인의 다크 톤 백팩.', 49000, 15, '악세서리', '/images/sun-lingyan-_H0fjILH5Vw-unsplash.jpg'),
('기본 검정 티셔츠', '무지 크루넥 반팔 티셔츠.', 19900, 100, '의류', '/images/istockphoto-2206793808-1024x1024.jpg');

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'paid', 'shipped', 'completed', 'cancelled') DEFAULT 'paid',
  imp_uid VARCHAR(100) DEFAULT NULL,
  merchant_uid VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO orders (user_id, recipient_name, address, phone, total_price)
VALUES
(1, '홍길동', '서울특별시 강남구 역삼동', '010-1234-5678', 1850000),
(1, '김승태', '수원시 영통구 이의동', '010-5678-9999', 2150000);

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES
(1, 1, 1, 1500000),
(1, 3, 1, 350000),
(2, 2, 1, 2000000),
(2, 4, 1, 150000);

SELECT 'myshop DB 초기화 완료 (users, products, orders, order_items)' AS result;
