-- 관리자 로그인을 위해 users 테이블에 role 컬럼 추가
-- (init_JJpackage.sql 로 만든 DB에는 이미 role 이 있으면 이 파일 불필요)

-- 1) role 컬럼 추가 (이미 있으면 에러 나므로 무시하고 2번만 실행)
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';

-- 2) 관리자로 쓸 계정 지정 (로그인에 쓰는 이메일로 변경해서 실행)
UPDATE users SET role = 'admin' WHERE email = 'admin@myshop.com';