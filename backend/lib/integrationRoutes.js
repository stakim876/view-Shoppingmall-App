import { Router } from 'express';
import { requireIntegrationKey } from './integrationAuth.js';

export function createIntegrationRouter(db) {
  const router = Router();
  router.use(requireIntegrationKey);

  router.get('/health', (_req, res) => {
    res.json({ success: true, service: 'my-shop', integration: true });
  });

  router.get('/products', async (_req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT id, name, sku, price, stock, category, image_url, updated_at
         FROM products
         ORDER BY id ASC`,
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      console.error('integration products error:', err);
      res.status(500).json({ success: false, message: '상품 목록 조회 실패' });
    }
  });

  router.put('/products/:id/stock', async (req, res) => {
    const id = Number(req.params.id);
    const stock = Number(req.body?.stock);
    if (!id || !Number.isFinite(stock) || stock < 0) {
      return res.status(400).json({ success: false, message: '유효한 stock 값이 필요합니다.' });
    }

    try {
      const [result] = await db.query('UPDATE products SET stock = ? WHERE id = ?', [stock, id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
      }
      res.json({ success: true, data: { id, stock } });
    } catch (err) {
      console.error('integration stock update error:', err);
      res.status(500).json({ success: false, message: '재고 업데이트 실패' });
    }
  });

  router.get('/orders', async (req, res) => {
    const statusParam = String(req.query.status || 'paid,preparing');
    const statuses = statusParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const placeholders = statuses.map(() => '?').join(', ');
      const [orders] = await db.query(
        `SELECT id, user_id, recipient_name, address, phone, total_price, status, created_at,
                carrier_code, tracking_number
         FROM orders
         WHERE status IN (${placeholders})
         ORDER BY created_at ASC`,
        statuses,
      );

      const orderIds = orders.map((o) => o.id);
      let itemsByOrder = new Map();
      if (orderIds.length > 0) {
        const [items] = await db.query(
          `SELECT oi.order_id, oi.product_id, oi.quantity, oi.price,
                  p.name AS product_name, p.sku AS product_sku
           FROM order_items oi
           LEFT JOIN products p ON p.id = oi.product_id
           WHERE oi.order_id IN (?)`,
          [orderIds],
        );
        itemsByOrder = items.reduce((map, row) => {
          const list = map.get(row.order_id) || [];
          list.push(row);
          map.set(row.order_id, list);
          return map;
        }, new Map());
      }

      const data = orders.map((order) => ({
        ...order,
        items: itemsByOrder.get(order.id) || [],
      }));

      res.json({ success: true, data });
    } catch (err) {
      console.error('integration orders error:', err);
      res.status(500).json({ success: false, message: '주문 목록 조회 실패' });
    }
  });

  router.get('/orders/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: '주문 ID가 필요합니다.' });
    }

    try {
      const [orderRows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
      const order = orderRows[0];
      if (!order) {
        return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
      }

      const [items] = await db.query(
        `SELECT oi.id, oi.product_id, oi.quantity, oi.price,
                p.name AS product_name, p.sku AS product_sku, p.image_url
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`,
        [id],
      );

      res.json({
        success: true,
        data: {
          order,
          items,
        },
      });
    } catch (err) {
      console.error('integration order detail error:', err);
      res.status(500).json({ success: false, message: '주문 상세 조회 실패' });
    }
  });

  router.put('/orders/:id/fulfillment', async (req, res) => {
    const id = Number(req.params.id);
    const { status, carrier_code, tracking_number } = req.body || {};
    const allowed = new Set(['preparing', 'shipping', 'done', 'cancelled']);

    if (!id) {
      return res.status(400).json({ success: false, message: '주문 ID가 필요합니다.' });
    }
    if (!status || !allowed.has(String(status))) {
      return res.status(400).json({ success: false, message: '유효하지 않은 주문 상태입니다.' });
    }

    try {
      if (carrier_code && tracking_number) {
        await db.query(
          'UPDATE orders SET status = ?, carrier_code = ?, tracking_number = ? WHERE id = ?',
          [status, carrier_code, tracking_number, id],
        );
      } else {
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
      }
      res.json({ success: true, message: '주문 상태가 업데이트되었습니다.' });
    } catch (err) {
      console.error('integration fulfillment error:', err);
      res.status(500).json({ success: false, message: '주문 상태 업데이트 실패' });
    }
  });

  return router;
}
