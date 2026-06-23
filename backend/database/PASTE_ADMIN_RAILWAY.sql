USE `railway`;

INSERT INTO users (email, password, name, gender, role)
VALUES (
  'admin@myshop.com',
  '$2b$10$966x.YwQvJsgIWxEMM3C/uGWOWHNgjOd5wTVu62V1R0BzghA7cVW.',
  '관리자',
  'male',
  'admin'
) AS new_row
ON DUPLICATE KEY UPDATE
  password = new_row.password,
  role = new_row.role;
