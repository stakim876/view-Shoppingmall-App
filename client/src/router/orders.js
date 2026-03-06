import express from "express";
import db from "../db.js"; 
const router = express.Router();

router.post("/", async (req, res) => {
  const { recipient_name, address, phone, total_price, items } = req.body;

  if (!recipient_name || !address || !phone || !items || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "필수 항목이 누락되었습니다." });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [orderResult] = await conn.query(
      `INSERT INTO orders (recipient_name, address, phone, total_price, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [recipient_name, address, phone, total_price]
    );
    const orderId = orderResult.insertId;

    const values = items.map((item) => [
      orderId,
      item.id,
      item.price,
      item.quantity,
    ]);

    await conn.query(
      `INSERT INTO order_items (order_id, product_id, price, quantity)
       VALUES ?`,
      [values]
    );

    await conn.commit();
    res.status(200).json({ success: true, orderId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ 주문 생성 실패:", err);
    res
      .status(500)
      .json({ success: false, message: "서버 오류로 주문 생성에 실패했습니다." });
  } finally {
    conn.release();
  }
});

router.get("/detail/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [[order]] = await db.query(
      "SELECT * FROM orders WHERE id = ?",
      [id]
    );

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "주문을 찾을 수 없습니다." });

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

export default router;
