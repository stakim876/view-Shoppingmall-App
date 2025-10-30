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

export default router;
