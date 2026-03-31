
USE myshop;

UPDATE products SET image_url = '/images/iphone15.jpg' WHERE name = '아이폰 15';
UPDATE products SET image_url = '/images/macbookpro.jpg' WHERE name = '맥북 프로';
UPDATE products SET image_url = '/images/airpodspro.jpg' WHERE name = '에어팟 프로';
UPDATE products SET image_url = '/images/applewatch.png' WHERE name = '애플워치 9';
UPDATE products SET image_url = '/images/ipadpro.png' WHERE name = '아이패드 프로';
UPDATE products SET image_url = '/images/linda-xu-fUEP0djb1hA-unsplash.jpg' WHERE name = '뉴발란스 파스텔 스니커즈';
UPDATE products SET image_url = '/images/jordan-whitfield-Lprffwrv9cY-unsplash.jpg' WHERE name = '데님 자켓 & 니트 비니';
UPDATE products SET image_url = '/images/sun-lingyan-_H0fjILH5Vw-unsplash.jpg' WHERE name = '미니멀 백팩';
UPDATE products SET image_url = '/images/istockphoto-2206793808-1024x1024.jpg' WHERE name = '기본 검정 티셔츠';

SELECT id, name, image_url FROM products;
