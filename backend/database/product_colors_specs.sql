-- 상품 색상 옵션(JSON 배열 문자열) · 노트북 사양(JSON 객체 문자열)
-- 예: color_options '["실버","스페이스 그레이"]'
--     laptop_specs '{"cpu":"Apple M3","ram":"16GB","storage":"512GB SSD","display":"14.2\" Liquid Retina","gpu":"10코어 GPU"}'

ALTER TABLE products
  ADD COLUMN color_options TEXT NULL COMMENT 'JSON array of color names' AFTER stock,
  ADD COLUMN laptop_specs TEXT NULL COMMENT 'JSON object: cpu, ram, storage, display, gpu' AFTER color_options;
