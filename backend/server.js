import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "3752",
  database: process.env.DB_NAME || "myshop",
  port: process.env.DB_PORT || 3306,
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB 연결 실패:", err);
  } else {
    console.log("✅ MySQL 연결 성공");
  }
});

app.get("/api/products", (req, res) => {
  const query = "SELECT * FROM products";
  db.query(query, (err, results) => {
    if (err) {
      console.error("상품 조회 오류:", err);
      return res.status(500).json({ error: "상품 조회 실패" });
    }
    res.json(results);
  });
});

app.get("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM products WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("상품 상세 조회 오류:", err);
      return res.status(500).json({ error: "상품 조회 실패" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "상품을 찾을 수 없습니다." });
    }
    res.json(results[0]);
  });
});

app.post("/api/orders", (req, res) => {
  const { userId, items, totalPrice, recipient_name, address, phone } = req.body;

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: "트랜잭션 시작 실패" });

    const orderQuery = `
      INSERT INTO orders (user_id, recipient_name, address, phone, total_price)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(orderQuery, [userId, recipient_name, address, phone, totalPrice], (err, result) => {
      if (err) {
        return db.rollback(() => {
          console.error("주문 생성 오류:", err);
          res.status(500).json({ error: "주문 생성 실패" });
        });
      }

      const orderId = result.insertId;
      const itemQuery = `
        INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
        VALUES ?
      `;

      const values = items.map((item) => [
        orderId,
        item.id,
        item.name,
        item.quantity,
        item.price,
      ]);

      db.query(itemQuery, [values], (err2) => {
        if (err2) {
          return db.rollback(() => {
            console.error("주문 상세 저장 오류:", err2);
            res.status(500).json({ error: "주문 상세 저장 실패" });
          });
        }

        db.commit((err3) => {
          if (err3) {
            return db.rollback(() => {
              console.error("커밋 오류:", err3);
              res.status(500).json({ error: "주문 커밋 실패" });
            });
          }

          res.json({ success: true, orderId });
        });
      });
    });
  });
});
