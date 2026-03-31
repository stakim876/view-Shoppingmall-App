
ALTER TABLE orders
  ADD COLUMN carrier_code VARCHAR(32) DEFAULT NULL COMMENT '택배사 키(cj,hanjin,lotte,...)',
  ADD COLUMN tracking_number VARCHAR(100) DEFAULT NULL COMMENT '송장번호';
