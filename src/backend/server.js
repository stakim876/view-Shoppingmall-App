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


app.post("/api/products/add", (req, res) => {
  const { name, description, price, image_url } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: "상품명과 가격은 필수입니다." });
  }

  const query = `
    INSERT INTO products (name, description, price, image_url)
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [name, description, price, image_url], (err, result) => {
    if (err) {
      console.error("상품 등록 오류:", err);
      return res.status(500).json({ error: "상품 등록 실패" });
    }
    res.json({ success: true, productId: result.insertId });
  });
});


app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url } = req.body;

  const query = `
    UPDATE products
    SET name = ?, description = ?, price = ?, image_url = ?
    WHERE id = ?
  `;
  db.query(query, [name, description, price, image_url, id], (err) => {
    if (err) {
      console.error("상품 수정 오류:", err);
      return res.status(500).json({ error: "상품 수정 실패" });
    }
    res.json({ success: true });
  });
});


app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM products WHERE id = ?";
  db.query(query, [id], (err) => {
    if (err) {
      console.error("상품 삭제 오류:", err);
      return res.status(500).json({ error: "상품 삭제 실패" });
    }
    res.json({ success: true });
  });
});


app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력하세요." });
  }

  const query = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error("로그인 오류:", err);
      return res.status(500).json({ error: "DB 오류" });
    }

    if (results.length === 0) {
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    res.json({
      success: true,
      user: {
        id: results[0].id,
        email: results[0].email,
        name: results[0].name,
        role: results[0].role,
      },
    });
  });
});


app.post("/api/register", (req, res) => {
  const { email, password, name, gender } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호는 필수입니다." });
  }

  const query =
    "INSERT INTO users (email, password, name, gender) VALUES (?, ?, ?, ?)";
  db.query(query, [email, password, name, gender], (err, result) => {
    if (err) {
      console.error("회원가입 오류:", err);
      return res.status(500).json({ error: "회원가입 실패" });
    }

    res.json({ success: true, userId: result.insertId });
  });
});


app.post("/api/orders", (req, res) => {
  const { userId, items, totalPrice } = req.body;

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: "트랜잭션 시작 실패" });

    const orderQuery = "INSERT INTO orders (user_id, total_price) VALUES (?, ?)";
    db.query(orderQuery, [userId, totalPrice], (err, result) => {
      if (err) {
        return db.rollback(() => {
          console.error("주문 생성 오류:", err);
          res.status(500).json({ error: "주문 생성 실패" });
        });
      }

      const orderId = result.insertId;
      const itemQuery =
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?";
      const values = items.map((item) => [
        orderId,
        item.id,
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


app.get("/api/orders", (req, res) => {
  const query = `
    SELECT 
      o.id AS order_id,
      o.user_id,
      u.name AS user_name,
      o.total_price,
      o.created_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("전체 주문 조회 오류:", err);
      return res.status(500).json({ error: "DB 오류" });
    }
    res.json(results);
  });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
