import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import { getCafe24Client, isCafe24Enabled } from "./lib/cafe24.js";
import { hashPassword, verifyPassword, generateToken, authenticateToken } from "./lib/auth.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const clientImages = path.join(__dirname, "../client/public/images");
app.use("/images", express.static(clientImages));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"], 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "3752",
  database: process.env.DB_NAME || "myshop",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("✅ MySQL Connection Pool 생성 완료");

(async () => {
  try {
    const [rows] = await db.query("SELECT 1 AS ok");
    console.log("✅ DB 연결 테스트 OK:", rows[0]);
  } catch (e) {
    console.error("❌ DB 연결 테스트 실패:", e.message);
  }
})();

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API 서버 정상" });
});

// ----- 찜(위시리스트) API - 상단에 등록 -----
app.get("/api/wishlist/check", (req, res) => {
  res.json({ ok: true, message: "wishlist API loaded" });
});
app.get("/api/wishlist/ids", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      "SELECT product_id FROM wishlists WHERE user_id = ?",
      [userId]
    );
    res.json(rows.map((r) => r.product_id));
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") return res.json([]);
    console.error("❌ 찜 ID 목록 조회 오류:", err);
    res.status(500).json({ error: "찜 ID 목록 조회 실패", message: err.message });
  }
});
app.get("/api/wishlist", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      `SELECT w.id, w.product_id, w.created_at,
              p.name, p.description, p.price, p.image_url, p.category
       FROM wishlists w
       LEFT JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );
    const list = rows.filter((r) => r.name != null).map((r) => ({
      id: r.id,
      product_id: r.product_id,
      created_at: r.created_at,
      name: r.name,
      description: r.description,
      price: r.price,
      image_url: r.image_url,
      category: r.category,
    }));
    res.json(list);
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") return res.json([]);
    console.error("❌ 찜 목록 조회 오류:", err);
    res.status(500).json({ error: "찜 목록 조회 실패", message: err.message });
  }
});
app.post("/api/wishlist/:productId", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const productId = Number(req.params.productId);
  if (!productId) {
    return res.status(400).json({ success: false, message: "상품 ID가 필요합니다." });
  }
  try {
    await db.query(
      "INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)",
      [userId, productId]
    );
    res.json({ success: true, message: "찜 목록에 추가되었습니다." });
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "찜 기능을 사용하려면 DB 마이그레이션(wishlist.sql)을 실행해 주세요." });
    }
    console.error("❌ 찜 추가 오류:", err);
    res.status(500).json({ success: false, message: "찜 추가 실패" });
  }
});
app.delete("/api/wishlist/:productId", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const productId = Number(req.params.productId);
  if (!productId) {
    return res.status(400).json({ success: false, message: "상품 ID가 필요합니다." });
  }
  try {
    await db.query("DELETE FROM wishlists WHERE user_id = ? AND product_id = ?", [
      userId,
      productId,
    ]);
    res.json({ success: true, message: "찜 목록에서 제거되었습니다." });
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") return res.json({ success: true });
    console.error("❌ 찜 제거 오류:", err);
    res.status(500).json({ success: false, message: "찜 제거 실패" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    if (isCafe24Enabled()) {
      try {
        const cafe24 = getCafe24Client();
        if (cafe24) {
          const products = await cafe24.getProducts({ limit: 1000 });
          const transformed = products.map((p) => cafe24.transformProduct(p));
          const set = new Set();
          transformed.forEach((p) => {
            const c = (p.category || "").trim();
            if (c) set.add(c);
          });
          const list = Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
          return res.json(list);
        }
      } catch (e) {
        console.warn("⚠️ 카테고리 카페24 조회 실패:", e.message);
      }
    }
    const [rows] = await db.query(
      "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND TRIM(category) != '' ORDER BY category ASC"
    );
    res.json(rows.map((r) => r.category));
  } catch (err) {
    console.error("❌ 카테고리 조회 오류:", err);
    res.status(500).json({ error: "카테고리 조회 실패", message: err.message });
  }
});

// 카페24 API 연결 테스트 엔드포인트
app.get("/api/cafe24/test", async (req, res) => {
  try {
    if (!isCafe24Enabled()) {
      return res.json({
        enabled: false,
        message: "카페24가 설정되지 않았습니다. 환경 변수를 확인해주세요.",
      });
    }

    const cafe24 = getCafe24Client();
    if (!cafe24) {
      return res.json({
        enabled: false,
        message: "카페24 클라이언트를 초기화할 수 없습니다.",
      });
    }

    const isConnected = await cafe24.testConnection();
    res.json({
      enabled: true,
      connected: isConnected,
      mallId: process.env.CAFE24_MALL_ID,
      message: isConnected
        ? "카페24 API 연결 성공"
        : "카페24 API 연결 실패 - Access Token을 확인해주세요.",
    });
  } catch (error) {
    res.status(500).json({
      enabled: true,
      connected: false,
      error: error.message,
    });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    // 카페24가 활성화되어 있으면 카페24에서 가져오기
    if (isCafe24Enabled()) {
      try {
        const cafe24 = getCafe24Client();
        if (cafe24) {
          const { limit, offset, category } = req.query;
          const products = await cafe24.getProducts({
            limit: limit || 100,
            offset: offset || 0,
            category: category,
          });
          
          // 카페24 데이터를 내부 형식으로 변환
          const transformedProducts = products.map(p => cafe24.transformProduct(p));
          return res.json(transformedProducts);
        }
      } catch (cafe24Error) {
        console.warn("⚠️ 카페24 상품 조회 실패, MySQL로 폴백:", cafe24Error.message);
        // 카페24 에러 시 MySQL로 폴백
      }
    }
    
    // 카페24가 없거나 실패하면 MySQL에서 가져오기 (기본 동작)
    const [results] = await db.query("SELECT * FROM products ORDER BY id ASC");
    res.json(results);
  } catch (err) {
    console.error("❌ 상품 조회 오류:", err);
    res.status(500).json({ error: "상품 조회 실패", message: err.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // 카페24가 활성화되어 있으면 카페24에서 가져오기
    if (isCafe24Enabled()) {
      try {
        const cafe24 = getCafe24Client();
        if (cafe24) {
          const product = await cafe24.getProduct(id);
          if (!product) {
            return res.status(404).json({ error: "상품을 찾을 수 없습니다." });
          }
          return res.json(cafe24.transformProduct(product));
        }
      } catch (cafe24Error) {
        console.warn("⚠️ 카페24 상품 상세 조회 실패, MySQL로 폴백:", cafe24Error.message);
        // 카페24 에러 시 MySQL로 폴백
      }
    }
    
    // MySQL: 상품 + 갤러리 이미지
    const [results] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    if (results.length === 0) {
      return res.status(404).json({ error: "상품을 찾을 수 없습니다." });
    }
    const product = results[0];
    try {
      const [imgRows] = await db.query(
        "SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC",
        [id]
      );
      product.images = imgRows.length > 0 ? imgRows.map((r) => r.image_url) : [product.image_url];
    } catch (_) {
      product.images = [product.image_url];
    }
    res.json(product);
  } catch (err) {
    console.error("❌ 상품 상세 조회 오류:", err);
    res.status(500).json({ error: "상품 조회 실패", message: err.message });
  }
});

app.post("/api/products/add", authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, price, image_url, category, stock } = req.body;

  if (!name || price == null) {
    return res.status(400).json({ success: false, message: "상품명과 가격은 필수입니다." });
  }

  try {
    await db.query(
      "INSERT INTO products (name, description, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)",
      [
        name,
        description || "",
        Number(price),
        image_url || "",
        category || null,
        stock != null && stock !== "" ? Number(stock) : 0,
      ]
    );
    res.json({ success: true, message: "상품이 등록되었습니다." });
  } catch (err) {
    console.error("❌ 상품 등록 오류:", err);
    res.status(500).json({ success: false, message: "상품 등록 실패" });
  }
});

app.put("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, price, image_url, category, stock } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: "상품 ID가 필요합니다." });
  }
  try {
    const [result] = await db.query(
      `UPDATE products SET 
        name = COALESCE(?, name), description = COALESCE(?, description), price = COALESCE(?, price),
        image_url = COALESCE(?, image_url), category = ?, stock = COALESCE(?, stock)
      WHERE id = ?`,
      [name, description, price != null ? Number(price) : null, image_url, category || null, stock != null ? Number(stock) : null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "상품을 찾을 수 없습니다." });
    }
    res.json({ success: true, message: "상품이 수정되었습니다." });
  } catch (err) {
    console.error("❌ 상품 수정 오류:", err);
    res.status(500).json({ success: false, message: "상품 수정 실패" });
  }
});

app.get("/api/products/:id/reviews", async (req, res) => {
  const productId = Number(req.params.id);
  if (!productId) {
    return res.status(400).json({ error: "상품 ID가 필요합니다." });
  }
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.content, r.created_at, u.name AS user_name
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [productId]
    );
    res.json(rows);
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.json([]);
    }
    console.error("❌ 리뷰 조회 오류:", err);
    res.status(500).json({ error: "리뷰 조회 실패" });
  }
});

app.post("/api/products/:id/reviews", authenticateToken, async (req, res) => {
  const productId = Number(req.params.id);
  const userId = req.user.id;
  const { rating, content } = req.body;
  if (!productId || rating == null || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "별점(1~5)은 필수입니다." });
  }
  try {
    await db.query(
      "INSERT INTO reviews (product_id, user_id, rating, content) VALUES (?, ?, ?, ?)",
      [productId, userId, Number(rating), (content || "").trim()]
    );
    res.json({ success: true, message: "리뷰가 등록되었습니다." });
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "리뷰 테이블이 없습니다. DB 마이그레이션을 실행해 주세요." });
    }
    console.error("❌ 리뷰 등록 오류:", err);
    res.status(500).json({ success: false, message: "리뷰 등록 실패" });
  }
});

app.delete("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ success: false, message: "상품 ID가 필요합니다." });
  }
  try {
    const [result] = await db.query("DELETE FROM products WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "상품을 찾을 수 없습니다." });
    }
    res.json({ success: true, message: "상품이 삭제되었습니다." });
  } catch (err) {
    console.error("❌ 상품 삭제 오류:", err);
    res.status(500).json({ success: false, message: "상품 삭제 실패" });
  }
});

app.post("/api/orders", async (req, res) => {
  console.log("📦 주문 요청 데이터:", JSON.stringify(req.body, null, 2));

  const { userId, items, total_price, recipient_name, address, phone, imp_uid, merchant_uid } = req.body;

  const recipient = recipient_name || "이름없음";
  const addr = address || "주소없음";
  const tel = phone || "연락처없음";

  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "잘못된 주문 데이터입니다." });
  }

  if (total_price == null || isNaN(Number(total_price))) {
    return res.status(400).json({
      success: false,
      message: "❌ Invalid or missing total_price value",
    });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    if (imp_uid) {
      console.log(`✅ 결제 검증: imp_uid=${imp_uid}, merchant_uid=${merchant_uid}`);
    }

    // orders 테이블에 imp_uid, merchant_uid 컬럼이 있는지 확인하고 동적으로 쿼리 생성
    let orderColumns = "user_id, recipient_name, address, phone, total_price, status, created_at";
    let orderValues = "?, ?, ?, ?, ?, ?, NOW()";
    let orderParams = [userId, recipient, addr, tel, Number(total_price), "paid"];
    
    // imp_uid와 merchant_uid가 있으면 추가
    if (imp_uid || merchant_uid) {
      try {
        // 컬럼 존재 여부 확인을 위해 먼저 테스트 쿼리 실행
        await conn.query("SELECT imp_uid, merchant_uid FROM orders LIMIT 1");
        // 컬럼이 존재하면 추가
        orderColumns += ", imp_uid, merchant_uid";
        orderValues += ", ?, ?";
        orderParams.push(imp_uid || null, merchant_uid || null);
      } catch (colError) {
        // 컬럼이 없으면 무시하고 기본 컬럼만 사용
        console.warn("⚠️ imp_uid, merchant_uid 컬럼이 없습니다. 기본 컬럼만 사용합니다.");
      }
    }

    const [orderResult] = await conn.query(
      `INSERT INTO orders (${orderColumns}) VALUES (${orderValues})`,
      orderParams
    );

    const orderId = orderResult.insertId;
    console.log(`🆕 신규 주문 생성 완료 (order_id=${orderId})`);

    const placeholders = items.map(() => "(?, ?, ?, ?)").join(", ");
    const flatValues = items.flatMap((item) => [
      orderId,
      item.id,
      item.quantity || 1,
      Number(item.price),
    ]);

    await conn.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price)
       VALUES ${placeholders}`,
      flatValues
    );

    await conn.commit();
    console.log("✅ 주문 전체 처리 완료:", orderId);

    res.json({ success: true, orderId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ 주문 처리 중 오류 발생:", err);
    res.status(500).json({ success: false, message: "주문 생성 실패", error: err?.message || err });
  } finally {
    conn.release();
  }
});

app.get("/api/orders", authenticateToken, async (req, res) => {
  const { userId } = req.query;
  const requestUserId = userId || req.user?.id;

  if (!requestUserId) {
    return res.status(400).json({ success: false, message: "userId가 필요합니다." });
  }

  // 본인의 주문만 조회 가능하도록 체크
  if (req.user && req.user.id !== Number(requestUserId)) {
    return res.status(403).json({ success: false, message: "권한이 없습니다." });
  }

  try {
    const [orders] = await db.query(
      `SELECT 
          o.id, 
          o.recipient_name, 
          o.address, 
          o.total_price, 
          o.status, 
          o.created_at,
          GROUP_CONCAT(p.name SEPARATOR ', ') AS products
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = ?
       GROUP BY o.id, o.recipient_name, o.address, o.total_price, o.status, o.created_at
       ORDER BY o.created_at DESC`,
      [requestUserId]
    );

    res.json({ success: true, orders });
  } catch (err) {
    console.error("❌ 주문 내역 조회 오류:", err);
    res.status(500).json({ success: false, message: "주문 내역 조회 실패" });
  }
});

app.get("/api/orders/detail/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [orderRows] = await db.query("SELECT * FROM orders WHERE id = ?", [id]);
    const order = orderRows?.[0];

    if (!order) {
      return res.status(404).json({ success: false, message: "주문을 찾을 수 없습니다." });
    }

    const [items] = await db.query(
      `SELECT oi.*, p.name AS product_name, p.image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    res.json({
      success: true,
      order: {
        id: order.id,
        recipient_name: order.recipient_name,
        address: order.address,
        phone: order.phone,
        total_price: order.total_price,
        created_at: order.created_at,
        status: order.status,
      },
      items: items.map((i) => ({
        id: i.id,
        name: i.product_name,
        image_url: i.image_url,
        quantity: i.quantity,
        price: i.price,
      })),
    });
  } catch (err) {
    console.error("❌ 주문 상세 조회 실패:", err);
    res.status(500).json({ success: false, message: "주문 상세 조회 실패" });
  }
});

// 관리자 전용 미들웨어 (role === 'admin' 체크)
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "관리자 권한이 필요합니다." });
  }
  next();
}

app.get("/api/admin/orders", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        o.id,
        o.user_id,
        o.recipient_name,
        o.address,
        o.total_price,
        o.status,
        o.created_at,
        GROUP_CONCAT(p.name SEPARATOR ', ') AS products
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id, o.user_id, o.recipient_name, o.address, o.total_price, o.status, o.created_at
      ORDER BY o.created_at DESC
    `);

    res.json(orders);
  } catch (err) {
    console.error("❌ 관리자 주문 조회 오류:", err);
    res.status(500).json({ success: false, message: "주문 조회 실패" });
  }
});

app.put("/api/admin/orders/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: "status 값이 필요합니다." });
  }

  try {
    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true, message: "주문 상태가 변경되었습니다." });
  } catch (err) {
    console.error("❌ 주문 상태 변경 오류:", err);
    res.status(500).json({ success: false, message: "상태 변경 실패" });
  }
});

// ============================================
// 인증 관련 라우트
// ============================================

// 회원가입
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name, gender } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: "이메일, 비밀번호, 이름은 필수입니다.",
    });
  }

  try {
    // 이메일 중복 확인
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "이미 등록된 이메일입니다.",
      });
    }

    // 비밀번호 해시
    const hashedPassword = await hashPassword(password);

    // 사용자 생성
    const [result] = await db.query(
      "INSERT INTO users (email, password, name, gender, created_at) VALUES (?, ?, ?, ?, NOW())",
      [email, hashedPassword, name, gender || null]
    );

    // JWT 토큰 생성
    const token = generateToken({
      id: result.insertId,
      email: email,
      name: name,
    });

    res.status(201).json({
      success: true,
      message: "회원가입이 완료되었습니다.",
      token: token,
      user: {
        id: result.insertId,
        email: email,
        name: name,
        gender: gender || null,
      },
    });
  } catch (err) {
    console.error("❌ 회원가입 오류:", err);
    res.status(500).json({
      success: false,
      message: "회원가입 중 오류가 발생했습니다.",
    });
  }
});

// 관리자 회원가입 (초대 코드 필요)
const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || "admin2025";
app.post("/api/auth/signup-admin", async (req, res) => {
  const { email, password, name, inviteCode } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: "이메일, 비밀번호, 이름은 필수입니다.",
    });
  }
  if (!inviteCode || inviteCode !== ADMIN_INVITE_CODE) {
    return res.status(403).json({
      success: false,
      message: "관리자 초대 코드가 올바르지 않습니다.",
    });
  }

  try {
    const [existingUsers] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "이미 등록된 이메일입니다.",
      });
    }

    const hashedPassword = await hashPassword(password);
    const [result] = await db.query(
      "INSERT INTO users (email, password, name, gender, role, created_at) VALUES (?, ?, ?, NULL, 'admin', NOW())",
      [email, hashedPassword, name]
    );

    const token = generateToken({
      id: result.insertId,
      email,
      name,
      role: "admin",
    });

    res.status(201).json({
      success: true,
      message: "관리자 계정이 생성되었습니다.",
      token,
      user: {
        id: result.insertId,
        email,
        name,
        role: "admin",
      },
    });
  } catch (err) {
    console.error("❌ 관리자 회원가입 오류:", err);
    res.status(500).json({
      success: false,
      message: "회원가입 중 오류가 발생했습니다.",
    });
  }
});

// 로그인
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "이메일과 비밀번호를 입력해주세요.",
    });
  }

  try {
    // 사용자 조회
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const user = users[0];

    // 비밀번호 검증
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    // role 없으면 'user' (기존 DB 호환)
    const role = user.role || "user";

    // JWT 토큰 생성 (role 포함)
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role,
    });

    res.json({
      success: true,
      message: "로그인 성공",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        gender: user.gender,
        role,
      },
    });
  } catch (err) {
    console.error("❌ 로그인 오류:", err);
    res.status(500).json({
      success: false,
      message: "로그인 중 오류가 발생했습니다.",
    });
  }
});

// 현재 사용자 정보 조회 (보호된 라우트)
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query("SELECT id, email, name, gender, created_at FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    const u = users[0];
    // role은 JWT에서 가져옴 (DB에 role 컬럼 없어도 동작)
    if (req.user.role) u.role = req.user.role;
    else u.role = "user";

    res.json({
      success: true,
      user: u,
    });
  } catch (err) {
    console.error("❌ 사용자 정보 조회 오류:", err);
    res.status(500).json({
      success: false,
      message: "사용자 정보 조회 중 오류가 발생했습니다.",
    });
  }
});

// 사용자 정보 수정
app.put("/api/auth/me", authenticateToken, async (req, res) => {
  const { name, gender } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "이름은 필수입니다.",
    });
  }

  try {
    await db.query(
      "UPDATE users SET name = ?, gender = ? WHERE id = ?",
      [name.trim(), gender || null, req.user.id]
    );

    res.json({
      success: true,
      message: "정보가 수정되었습니다.",
    });
  } catch (err) {
    console.error("❌ 사용자 정보 수정 오류:", err);
    res.status(500).json({
      success: false,
      message: "정보 수정 중 오류가 발생했습니다.",
    });
  }
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log("✅ 찜 API: GET/POST/DELETE /api/wishlist, GET /api/wishlist/ids");
});
