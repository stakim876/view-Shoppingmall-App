-- 네 개 이미지로 상품 추가
-- DB 이름이 다르면 USE 뒤를 수정하세요. category/stock 컬럼이 없으면 아래 "간단 버전" 사용.

USE myshop;

-- (name, description, price, stock, category, image_url) 지원 시
INSERT INTO products (name, description, price, stock, category, image_url)
VALUES
('뉴발란스 파스텔 스니커즈', '라벤더와 코랄 포인트의 캐주얼 스니커즈. ENCAP 미드솔.', 13000, 30, '패션잡화', '/images/jordan-whitfield-Lprffwrv9cY-unsplash.jpg'),
('데님 자켓 & 니트 비니', '라이트 워싱 데님 자켓과 포레스트 그린 리브드 비니 세트.', 59000, 20, '의류', '/images/linda-xu-fUEP0djb1hA-unsplash.jpg'),
('미니멀 백팩', '심플한 디자인의 다크 톤 백팩. 데일리·출퇴근용.', 49000, 15, '악세서리', '/images/sun-lingyan-_H0fjILH5Vw-unsplash.jpg'),
('기본 검정 티셔츠', '무지 크루넥 반팔 티셔츠. 편안한 코튼 소재.', 19900, 100, '의류', '/images/istockphoto-2206793808-1024x1024.jpg');

-- category/stock 컬럼이 없을 때 사용 (위 INSERT 실행 후 에러 나면 주석 해제 후 이것만 실행):
-- INSERT INTO products (name, description, price, image_url)
-- VALUES
-- ('뉴발란스 파스텔 스니커즈', '라벤더와 코랄 포인트의 캐주얼 스니커즈.', 13000, '/images/jordan-whitfield-Lprffwrv9cY-unsplash.jpg'),
-- ('데님 자켓 & 니트 비니', '라이트 워싱 데님 자켓과 리브드 비니.', 59000, '/images/linda-xu-fUEP0djb1hA-unsplash.jpg'),
-- ('미니멀 백팩', '심플한 다크 톤 백팩.', 49000, '/images/sun-lingyan-_H0fjILH5Vw-unsplash.jpg'),
-- ('기본 검정 티셔츠', '무지 크루넥 반팔 티셔츠.', 19900, '/images/istockphoto-2206793808-1024x1024.jpg');
