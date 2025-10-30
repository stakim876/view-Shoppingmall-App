router.get("/detail/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [[order]] = await db.query(
      "SELECT * FROM orders WHERE id = ?",
      [id]
    );

    const [items] = await db.query(
      `SELECT oi.*, p.name, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    if (!order) return res.status(404).json({ message: "주문을 찾을 수 없습니다." });

    res.json({
      order: {
        ...order,
        shipping_name: order.shipping_name || "홍길동",
        shipping_address: order.shipping_address || "서울시 강남구 역삼동",
        shipping_phone: order.shipping_phone || "010-0000-0000",
      },
      items,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "주문 상세 조회 실패" });
  }
});
