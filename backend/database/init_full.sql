-- ============================================================
-- MY Shop DB 통합 초기화 스크립트
-- MySQL Workbench 또는 mysql 클라이언트에서 한 번에 실행하세요.
-- 실행 시 해당 DB의 기존 테이블(users, products, orders, order_items)은 삭제됩니다.
-- ============================================================

CREATE DATABASE IF NOT EXISTS myshop
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE myshop;

-- 기존 테이블 제거 (FK 때문에 order_items -> orders 순서)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------
-- 1. 회원
-- ----------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) DEFAULT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------
-- 2. 상품 (카페24 미사용 시 직접 등록용)
-- ----------------------------------------
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO products (name, description, price, image_url)
VALUES
('뉴발란스 파스텔 스니커즈', '라벤더와 코랄 포인트의 캐주얼 스니커즈.', 13000, '/images/jordan-whitfield-Lprffwrv9cY-unsplash.jpg'),
('데님 자켓 & 니트 비니', '라이트 워싱 데님 자켓과 포레스트 그린 리브드 비니.', 59000, '/images/linda-xu-fUEP0djb1hA-unsplash.jpg'),
('미니멀 백팩', '심플한 디자인의 다크 톤 백팩.', 49000, '/images/sun-lingyan-_H0fjILH5Vw-unsplash.jpg'),
('기본 검정 티셔츠', '무지 크루넥 반팔 티셔츠.', 19900, '/images/istockphoto-2206793808-1024x1024.jpg');

-- ----------------------------------------
-- 3. 주문
-- ----------------------------------------
CREATE TABLE orders (
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

-- ----------------------------------------
-- 4. 주문 상품
-- ----------------------------------------
CREATE TABLE order_items (
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

-- ----------------------------------------
-- 완료
-- ----------------------------------------
SELECT 'myshop DB 초기화 완료 (users, products, orders, order_items)' AS result;
