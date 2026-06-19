CREATE TABLE IF NOT EXISTS search_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  search_term VARCHAR(200) NOT NULL,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_search_term_created (search_term, created_at),
  INDEX idx_search_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
