import express from "express";
import mysql from "mysql2";

const router = express.Router();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "3752",
  database: "myshop",
});

router.get("/", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("상품 조회 실패:", err);
      res.status(500).json({ message: "DB 오류" });
      return;
    }
    res.status(200).json(results);
  });
});

router.get("/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    "SELECT * FROM products WHERE id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error("상품 상세 조회 실패:", err);
        res.status(500).json({ message: "DB 오류" });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ message: "상품을 찾을 수 없습니다." });
        return;
      }

      res.status(200).json(results[0]);
    }
  );
});

export default router;
