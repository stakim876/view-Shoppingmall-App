
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';

UPDATE users SET role = 'admin' WHERE email = 'admin@myshop.com';