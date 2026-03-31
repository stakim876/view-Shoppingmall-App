
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE COMMENT '쿠폰 코드 (대소문자 구분 없이 사용 권장)',
  name VARCHAR(100) DEFAULT NULL COMMENT '쿠폰 이름(관리용)',
  type ENUM('fixed', 'percent') NOT NULL DEFAULT 'fixed' COMMENT 'fixed=정액, percent=정률',
  value DECIMAL(12,2) NOT NULL COMMENT '할인액(원) 또는 할인율(%)',
  min_order_amount DECIMAL(12,2) DEFAULT NULL COMMENT '최소 주문 금액 (이 금액 이상일 때만 적용)',
  max_discount DECIMAL(12,2) DEFAULT NULL COMMENT '정률일 때 최대 할인 한도(원)',
  valid_from DATETIME DEFAULT NULL COMMENT '사용 시작일 (NULL=제한없음)',
  valid_until DATETIME DEFAULT NULL COMMENT '사용 종료일 (NULL=제한없음)',
  usage_limit INT DEFAULT NULL COMMENT '총 사용 횟수 제한 (NULL=무제한)',
  used_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_valid (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE orders ADD COLUMN coupon_id INT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0;

