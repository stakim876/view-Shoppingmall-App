/**
 * 주문 금액·멱등 처리 — 클라이언트 단가가 아닌 카탈로그(DB) 가격 기준
 */

export function buildPricedLineItems(requestItems, catalogById) {
  const lines = [];

  for (const it of requestItems) {
    const productId = Number(it.id);
    const quantity = Number(it.quantity || 1);

    if (!Number.isFinite(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
      return { ok: false, code: "INVALID_ORDER_ITEMS", message: "주문 상품 데이터가 올바르지 않습니다." };
    }

    const product = catalogById.get(productId);
    if (!product) {
      return {
        ok: false,
        code: "PRODUCT_NOT_FOUND",
        message: `상품(ID:${productId})을 찾을 수 없습니다.`,
      };
    }

    const unitPrice = Number(product.price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return {
        ok: false,
        code: "INVALID_PRODUCT_PRICE",
        message: `상품(ID:${productId}) 가격 정보가 올바르지 않습니다.`,
      };
    }

    lines.push({
      productId,
      name: product.name,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      stock: Number(product.stock ?? 0),
    });
  }

  return { ok: true, lines };
}

export function sumLineSubtotal(lines) {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}

export function totalsMatch(requestedTotal, expectedTotal, tolerance = 1) {
  return Math.abs(Number(requestedTotal) - Number(expectedTotal)) <= tolerance;
}

export async function findExistingOrderByPaymentRef(db, { impUid, merchantUid }) {
  const imp = String(impUid || "").trim();
  if (imp) {
    const [rows] = await db.query(
      `SELECT id, user_id FROM orders WHERE imp_uid = ? LIMIT 1`,
      [imp]
    );
    if (rows[0]) return rows[0];
  }

  const merchant = String(merchantUid || "").trim();
  if (merchant) {
    const [rows] = await db.query(
      `SELECT id, user_id FROM orders WHERE merchant_uid = ? LIMIT 1`,
      [merchant]
    );
    if (rows[0]) return rows[0];
  }

  return null;
}
