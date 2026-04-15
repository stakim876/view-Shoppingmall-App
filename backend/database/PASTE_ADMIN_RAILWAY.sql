USE `railway`;

INSERT INTO users (email, password, name, gender, role)
VALUES (
  'admin@myshop.com',
  '$2b$10$FvkvN5FvXJoPMoT57z3T9u8fVvPpK87JFid2Ct35qXyNruqVCp0cG',
  '관리자',
  'male',
  'admin'
) AS new_row
ON DUPLICATE KEY UPDATE
  password = new_row.password,
  role = new_row.role;
