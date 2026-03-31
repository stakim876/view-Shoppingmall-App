
USE myshop;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DELETE FROM notices WHERE title IN (
  '[포트폴리오] 본 쇼핑몰은 데모 사이트입니다',
  '배송 및 교환 안내',
  '고객센터 운영 안내'
);

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
