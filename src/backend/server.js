app.post('/api/orders', (req, res) => {
  const { userId, items, totalPrice } = req.body;

  const orderQuery = 'INSERT INTO orders (user_id, total_price) VALUES (?, ?)';
  db.query(orderQuery, [userId, totalPrice], (err, result) => {
    if (err) {
      console.error('주문 생성 오류:', err);
      return res.status(500).json({ error: '주문 생성 실패' });
    }

    const orderId = result.insertId;

    const itemQuery = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?';
    const values = items.map(item => [orderId, item.id, item.quantity, item.price]);

    db.query(itemQuery, [values], (err2) => {
      if (err2) {
        console.error('주문 상세 저장 오류:', err2);
        return res.status(500).json({ error: '주문 상세 저장 실패' });
      }

      res.json({ success: true, orderId });
    });
  });
});

app.get('/api/orders/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT 
      o.id AS order_id,
      o.total_price,
      o.created_at,
      p.name AS product_name,
      oi.quantity,
      oi.price
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('주문 조회 오류:', err);
      return res.status(500).json({ error: 'DB 오류' });
    }
    res.json(results);
  });
});
