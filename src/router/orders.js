router.get("/detail/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [[order]] = await db.query(
      "SELECT * FROM orders WHERE id = ?",
      [id]
    );

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
