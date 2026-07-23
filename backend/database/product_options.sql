ALTER TABLE products
  ADD COLUMN product_options TEXT NULL COMMENT 'JSON array of selectable option groups' AFTER laptop_specs;

ALTER TABLE order_items
  ADD COLUMN options_json TEXT NULL COMMENT '선택한 옵션 스냅샷 JSON' AFTER price;

UPDATE products SET product_options = '[{"key":"color","label":"색상","values":["블랙","블루","핑크","옐로","그린"]},{"key":"storage","label":"용량","values":["128GB","256GB","512GB"]}]'
WHERE name = '아이폰 15';

UPDATE products SET product_options = '[{"key":"color","label":"색상","values":["스페이스 그레이","실버"]},{"key":"storage","label":"저장공간","values":["512GB","1TB"]}]'
WHERE name = '맥북 프로';

UPDATE products SET product_options = '[{"key":"color","label":"색상","values":["화이트"]}]'
WHERE name = '에어팟 프로';

UPDATE products SET product_options = '[{"key":"size","label":"케이스 사이즈","values":["41mm","45mm"]},{"key":"color","label":"밴드 색상","values":["미드나이트","스타라이트","핑크"]}]'
WHERE name = '애플워치 9';

UPDATE products SET product_options = '[{"key":"size","label":"화면 크기","values":["11인치","12.9인치"]},{"key":"storage","label":"용량","values":["256GB","512GB","1TB"]},{"key":"color","label":"색상","values":["스페이스 블랙","실버"]}]'
WHERE name = '아이패드 프로';

UPDATE products SET product_options = '[{"key":"size","label":"사이즈","values":["230","240","250","260","270","280"]}]'
WHERE name = '뉴발란스 파스텔 스니커즈';

UPDATE products SET product_options = '[{"key":"size","label":"자켓 사이즈","values":["S","M","L","XL"]},{"key":"color","label":"색상","values":["인디고","블랙"]}]'
WHERE name = '데님 자켓 & 니트 비니';

UPDATE products SET product_options = '[{"key":"color","label":"색상","values":["블랙","차콜","네이비"]}]'
WHERE name = '미니멀 백팩';

UPDATE products SET product_options = '[{"key":"size","label":"사이즈","values":["S","M","L","XL","XXL"]}]'
WHERE name = '기본 검정 티셔츠';

SELECT id, name, product_options FROM products;
