-- orders 테이블에 결제 정보 컬럼 추가
-- 이 스크립트를 MySQL에서 실행하여 orders 테이블을 업데이트하세요.

-- imp_uid 컬럼 추가 (포트원 결제 고유 번호)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS imp_uid VARCHAR(100) DEFAULT NULL;

-- merchant_uid 컬럼 추가 (주문 고유 번호)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS merchant_uid VARCHAR(100) DEFAULT NULL;

-- 인덱스 추가 (선택사항, 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_imp_uid ON orders(imp_uid);
CREATE INDEX IF NOT EXISTS idx_merchant_uid ON orders(merchant_uid);
