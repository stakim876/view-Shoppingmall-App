import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "3752",
  database: process.env.DB_NAME || "myshop",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("✅ MySQL Connection Pool 생성 완료");

app.get("/api/products", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM products ORDER BY id ASC");
    res.json(results);
  } catch (err) {
    console.error("상품 조회 오류:", err);
    res.status(500).json({ error: "상품 조회 실패" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    if (results.length === 0)
      return res.status(404).json({ error: "상품을 찾을 수 없습니다." });
    res.json(results[0]);
  } catch (err) {
    console.error("상품 상세 조회 오류:", err);
    res.status(500).json({ error: "상품 조회 실패" });
  }
});

app.post("/api/orders", async (req, res) => {
  console.log("📦 주문 요청 데이터:", JSON.stringify(req.body, null, 2));

  const { userId, items, total_price, recipient_name, address, phone } = req.body;
  const recipient = recipient_name || "이름없음";
  const addr = address || "주소없음";
  const tel = phone || "연락처없음";

  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "잘못된 주문 데이터입니다." });
  }

  if (total_price == null || isNaN(total_price)) {
    return res.status(400).json({
      success: false,
      message: "❌ Invalid or missing total_price value",
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, recipient_name, address, phone, total_price, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, recipient, addr, tel, total_price, "paid"]
    );

    const orderId = orderResult.insertId;
    console.log(`🆕 신규 주문 생성 완료 (order_id=${orderId})`);

    const values = items.map((item) => [
      orderId,
      item.id,
      item.quantity || 1,
      Number(item.price),
    ]);

    await conn.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price)
       VALUES ?`,
      [values]
    );

    await conn.commit();
    console.log("✅ 주문 전체 처리 완료:", orderId);

    res.json({ success: true, orderId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ 주문 처리 중 오류 발생:", err);
    res.status(500).json({ success: false, message: "주문 생성 실패", error: err });
  } finally {
    conn.release();
  }
});

app.get("/api/orders", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: "userId가 필요합니다." });
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
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
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
    const [[order]] = await db.query("SELECT * FROM orders WHERE id = ?", [id]);
    if (!order)
      return res.status(404).json({ success: false, message: "주문을 찾을 수 없습니다." });

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

app.get("/api/admin/orders", async (req, res) => {
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
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(orders);
  } catch (err) {
    console.error("❌ 관리자 주문 조회 오류:", err);
    res.status(500).json({ success: false, message: "주문 조회 실패" });
  }
});

app.put("/api/admin/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true, message: "주문 상태가 변경되었습니다." });
  } catch (err) {
    console.error("❌ 주문 상태 변경 오류:", err);
    res.status(500).json({ success: false, message: "상태 변경 실패" });
  }
});

app.post("/api/products/add", async (req, res) => {
  const { name, description, price, image_url } = req.body;

  if (!name || !price) {
    return res.status(400).json({ success: false, message: "상품명과 가격은 필수입니다." });
  }

  try {
    await db.query(
      "INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)",
      [name, description || "", price, image_url || ""]
    );
    res.json({ success: true, message: "상품이 등록되었습니다." });
  } catch (err) {
    console.error("❌ 상품 등록 오류:", err);
    res.status(500).json({ success: false, message: "상품 등록 실패" });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
