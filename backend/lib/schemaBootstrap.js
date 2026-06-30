const DEMO_PRODUCTS = [
  ["아이폰 15", "최신 아이폰 모델", 1500000, 10, "디지털/가전", "/images/iphone15.jpg"],
  ["맥북 프로", "Apple M2 Pro 칩셋 탑재", 2800000, 5, "디지털/가전", "/images/macbookpro.jpg"],
  ["에어팟 프로", "노이즈 캔슬링 무선 이어폰", 350000, 30, "악세서리", "/images/airpodspro.jpg"],
  ["애플워치 9", "건강 모니터링 기능 강화", 650000, 20, "디지털/가전", "/images/applewatch.png"],
  ["아이패드 프로", "M2 칩 탑재 아이패드", 1400000, 8, "디지털/가전", "/images/ipadpro.png"],
  ["뉴발란스 파스텔 스니커즈", "라벤더와 코랄 포인트의 캐주얼 스니커즈.", 13000, 30, "패션잡화", "/images/linda-xu-fUEP0djb1hA-unsplash.jpg"],
  ["데님 자켓 & 니트 비니", "라이트 워싱 데님 자켓과 포레스트 그린 리브드 비니.", 59000, 20, "의류", "/images/jordan-whitfield-Lprffwrv9cY-unsplash.jpg"],
  ["미니멀 백팩", "심플한 디자인의 다크 톤 백팩.", 49000, 15, "악세서리", "/images/sun-lingyan-_H0fjILH5Vw-unsplash.jpg"],
  ["기본 검정 티셔츠", "무지 크루넥 반팔 티셔츠.", 19900, 100, "의류", "/images/istockphoto-2206793808-1024x1024.jpg"],
];

const DEMO_COUPONS = [
  ["WELCOME10", "신규 10% 할인", "percent", 10, 10000, 50000],
  ["SAVE3000", "3,000원 할인", "fixed", 3000, 30000, null],
];

async function tableExists(db, tableName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return Number(rows[0]?.cnt) > 0;
}

async function ensureColumn(db, tableName, columnName, definition) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  if (Number(rows[0]?.cnt) === 0) {
    await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  }
}

async function ensureIndex(db, tableName, indexName, columns, unique = false) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  if (Number(rows[0]?.cnt) === 0) {
    const kind = unique ? "UNIQUE INDEX" : "INDEX";
    const columnList = columns.map((c) => `\`${c}\``).join(", ");
    await db.query(`ALTER TABLE \`${tableName}\` ADD ${kind} \`${indexName}\` (${columnList})`);
  }
}

async function seedProductsIfEmpty(db) {
  const [rows] = await db.query("SELECT COUNT(*) AS cnt FROM products");
  if (Number(rows[0]?.cnt) > 0) return 0;

  let index = 1;
  for (const [name, description, price, stock, category, image_url] of DEMO_PRODUCTS) {
    const sku = `SHOP-${String(index).padStart(3, "0")}`;
    await db.query(
      `INSERT INTO products (name, description, price, stock, category, image_url, sku) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, stock, category, image_url, sku]
    );
    index += 1;
  }
  return DEMO_PRODUCTS.length;
}

async function seedCouponsIfEmpty(db) {
  const [rows] = await db.query("SELECT COUNT(*) AS cnt FROM coupons");
  if (Number(rows[0]?.cnt) > 0) return 0;

  for (const [code, name, type, value, min_order_amount, max_discount] of DEMO_COUPONS) {
    await db.query(
      `INSERT INTO coupons (code, name, type, value, min_order_amount, max_discount) VALUES (?, ?, ?, ?, ?, ?)`,
      [code, name, type, value, min_order_amount, max_discount]
    );
  }
  return DEMO_COUPONS.length;
}

export async function ensureDatabaseSchema(db) {
  const summary = { tables: [], seededProducts: 0, seededCoupons: 0 };

  if (!(await tableExists(db, "users"))) {
    await db.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        gender ENUM('male', 'female', 'other'),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("users");
  } else {
    await ensureColumn(db, "users", "gender", "ENUM('male', 'female', 'other') NULL");
    await ensureColumn(db, "users", "role", "VARCHAR(20) DEFAULT 'user'");
    await ensureColumn(db, "users", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  }

  if (!(await tableExists(db, "products"))) {
    await db.query(`
      CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock INT DEFAULT 0,
        sku VARCHAR(50) NULL COMMENT 'WMS 연동 SKU',
        category VARCHAR(100),
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        UNIQUE INDEX uk_products_sku (sku)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("products");
  }

  await ensureColumn(db, "products", "sku", "VARCHAR(50) NULL COMMENT 'WMS 연동 SKU'");
  await db.query(
    `UPDATE products SET sku = CONCAT('SHOP-', LPAD(id, 3, '0')) WHERE sku IS NULL OR sku = ''`
  );
  await ensureIndex(db, "products", "uk_products_sku", ["sku"], true);

  if (!(await tableExists(db, "orders"))) {
    await db.query(`
      CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        recipient_name VARCHAR(100) NOT NULL,
        address VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'paid', 'shipped', 'completed', 'cancelled') DEFAULT 'paid',
        imp_uid VARCHAR(100) DEFAULT NULL,
        merchant_uid VARCHAR(100) DEFAULT NULL,
        coupon_id INT DEFAULT NULL,
        discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        carrier_code VARCHAR(32) DEFAULT NULL,
        tracking_number VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        UNIQUE INDEX uk_imp_uid (imp_uid),
        UNIQUE INDEX uk_merchant_uid (merchant_uid),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("orders");
  } else {
    await ensureColumn(db, "orders", "imp_uid", "VARCHAR(100) DEFAULT NULL");
    await ensureColumn(db, "orders", "merchant_uid", "VARCHAR(100) DEFAULT NULL");
    await ensureColumn(db, "orders", "coupon_id", "INT DEFAULT NULL");
    await ensureColumn(db, "orders", "discount_amount", "DECIMAL(12,2) NOT NULL DEFAULT 0");
    await ensureColumn(db, "orders", "carrier_code", "VARCHAR(32) DEFAULT NULL COMMENT '택배사 키'");
    await ensureColumn(db, "orders", "tracking_number", "VARCHAR(100) DEFAULT NULL COMMENT '송장번호'");
    await ensureIndex(db, "orders", "uk_imp_uid", ["imp_uid"], true);
    await ensureIndex(db, "orders", "uk_merchant_uid", ["merchant_uid"], true);
  }

  if (!(await tableExists(db, "order_items"))) {
    await db.query(`
      CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id),
        INDEX idx_product_id (product_id),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("order_items");
  }

  if (!(await tableExists(db, "wishlists"))) {
    await db.query(`
      CREATE TABLE wishlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_product (user_id, product_id),
        INDEX idx_user_id (user_id),
        INDEX idx_product_id (product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("wishlists");
  }

  if (!(await tableExists(db, "notices"))) {
    await db.query(`
      CREATE TABLE notices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        priority INT NOT NULL DEFAULT 0,
        starts_at DATETIME NULL,
        ends_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_public (is_active, starts_at, ends_at),
        INDEX idx_priority (priority)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("notices");
  }

  if (!(await tableExists(db, "restock_subscriptions"))) {
    await db.query(`
      CREATE TABLE restock_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        notified_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_product_email (product_id, email),
        INDEX idx_product_notified (product_id, notified_at),
        CONSTRAINT fk_restock_product
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("restock_subscriptions");
  }

  if (!(await tableExists(db, "coupons"))) {
    await db.query(`
      CREATE TABLE coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) DEFAULT NULL,
        type ENUM('fixed', 'percent') NOT NULL DEFAULT 'fixed',
        value DECIMAL(12,2) NOT NULL,
        min_order_amount DECIMAL(12,2) DEFAULT NULL,
        max_discount DECIMAL(12,2) DEFAULT NULL,
        valid_from DATETIME DEFAULT NULL,
        valid_until DATETIME DEFAULT NULL,
        usage_limit INT DEFAULT NULL,
        used_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_valid (valid_from, valid_until)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("coupons");
  }

  if (!(await tableExists(db, "quote_inquiries"))) {
    await db.query(`
      CREATE TABLE quote_inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(30) DEFAULT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("quote_inquiries");
  }

  if (!(await tableExists(db, "product_images"))) {
    await db.query(`
      CREATE TABLE product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product_id (product_id),
        CONSTRAINT fk_product_images_product
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("product_images");
  }

  if (!(await tableExists(db, "reviews"))) {
    await db.query(`
      CREATE TABLE reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        rating TINYINT NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reviews_product_id (product_id),
        INDEX idx_reviews_user_id (user_id),
        CONSTRAINT fk_reviews_product
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        CONSTRAINT fk_reviews_user
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("reviews");
  }

  if (!(await tableExists(db, "ai_recommend_events"))) {
    await db.query(`
      CREATE TABLE ai_recommend_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        event_name VARCHAR(40) NOT NULL,
        prompt_text TEXT NULL,
        product_id INT NULL,
        source VARCHAR(40) NULL,
        session_id VARCHAR(100) NULL,
        user_id INT NULL,
        meta_json JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ai_recommend_events_name_created (event_name, created_at),
        INDEX idx_ai_recommend_events_product_created (product_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("ai_recommend_events");
  }

  if (!(await tableExists(db, "search_events"))) {
    await db.query(`
      CREATE TABLE search_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        search_term VARCHAR(200) NOT NULL,
        user_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_search_term_created (search_term, created_at),
        INDEX idx_search_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("search_events");
  }

  if (!(await tableExists(db, "visitor_daily"))) {
    await db.query(`
      CREATE TABLE visitor_daily (
        visit_date DATE NOT NULL PRIMARY KEY,
        view_count INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("visitor_daily");
  }

  if (!(await tableExists(db, "visitor_total"))) {
    await db.query(`
      CREATE TABLE visitor_total (
        id TINYINT NOT NULL PRIMARY KEY DEFAULT 1,
        view_count BIGINT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    summary.tables.push("visitor_total");
  }

  await db.query(`INSERT IGNORE INTO visitor_total (id, view_count) VALUES (1, 0)`);

  summary.seededProducts = await seedProductsIfEmpty(db);
  summary.seededCoupons = await seedCouponsIfEmpty(db);

  return summary;
}
