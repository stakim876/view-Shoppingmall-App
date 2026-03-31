
CREATE DATABASE IF NOT EXISTS myshop
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE myshop;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS notices;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

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

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  address VARCHAR(500) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'paid',
  carrier_code VARCHAR(32) DEFAULT NULL,
  tracking_number VARCHAR(100) DEFAULT NULL,
  imp_uid VARCHAR(100) DEFAULT NULL,
  merchant_uid VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE notices (
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

INSERT INTO notices (title, body, is_active, priority, starts_at, ends_at) VALUES
(
  '[포트폴리오] 본 쇼핑몰은 데모 사이트입니다',
  '이 사이트는 개인 포트폴리오용 이커머스 데모입니다. 실제 상품 판매·배송·결제 대행은 이루어지지 않으며, 테스트 결제 환경으로 동작할 수 있습니다. 문의는 데모 목적의 UI만 제공됩니다.',
  1,
  10,
  NULL,
  NULL
),
(
  '배송 및 교환 안내',
  '데모 환경 기준 안내입니다. 일반적으로 주문 후 2~3영업일 내 출고를 목표로 하며, 단순 변심에 따른 교환·반품은 수령 후 7일 이내 가능합니다. 실제 정책은 운영 사이트 기준으로 별도 고지됩니다.',
  1,
  5,
  NULL,
  NULL
),
(
  '고객센터 운영 안내',
  '평일 10:00 ~ 17:00 (주말·공휴일 휴무) — 데모용 문구입니다. 헤더·푸터의 카카오 문의 등은 환경 변수 설정 시에만 실제 채널로 연결됩니다.',
  1,
  0,
  NULL,
  NULL
);

SELECT 'myshop DB 초기화 완료 (users, products, orders, order_items, notices)' AS result;
