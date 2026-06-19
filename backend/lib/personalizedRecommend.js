function parseRecentProductIds(raw) {
  if (Array.isArray(raw)) {
    return raw.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0).slice(0, 10);
  }
  const text = String(raw || "").trim();
  if (!text) return [];
  return text
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 10);
}

function buildReason(category, categoryWeights) {
  const weight = categoryWeights.get(category) || 0;
  if (weight >= 3) return "구매 이력 기반";
  if (weight >= 2) return "찜 목록과 유사";
  if (weight >= 1) return "최근 본 상품과 유사";
  return "인기 상품";
}

export async function getPersonalizedRecommendations(db, userId, options = {}) {
  const limit = Math.min(12, Math.max(1, Number(options.limit) || 6));
  const recentProductIds = parseRecentProductIds(options.recentProductIds);
  const purchasedIds = new Set();
  const categoryWeights = new Map();

  const addCategoryWeight = (category, weight) => {
    const cat = String(category || "").trim();
    if (!cat) return;
    categoryWeights.set(cat, (categoryWeights.get(cat) || 0) + weight);
  };

  if (userId) {
    const [orderItems] = await db.query(
      `SELECT DISTINCT oi.product_id, p.category
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE o.user_id = ? AND o.status NOT IN ('cancelled')`,
      [userId]
    );
    for (const row of orderItems) {
      purchasedIds.add(row.product_id);
      addCategoryWeight(row.category, 3);
    }

    try {
      const [wishlistRows] = await db.query(
        `SELECT p.id, p.category
         FROM wishlist w
         JOIN products p ON p.id = w.product_id
         WHERE w.user_id = ?`,
        [userId]
      );
      for (const row of wishlistRows) {
        addCategoryWeight(row.category, 2);
      }
    } catch (_) {
      // wishlist 테이블 없으면 무시
    }
  }

  if (recentProductIds.length > 0) {
    const [recentRows] = await db.query(
      `SELECT id, category FROM products WHERE id IN (?)`,
      [recentProductIds]
    );
    for (const row of recentRows) {
      addCategoryWeight(row.category, 1);
    }
  }

  const excludeIds = [...purchasedIds];
  let rows = [];

  if (categoryWeights.size > 0) {
    const topCategories = [...categoryWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category)
      .slice(0, 3);

    const catPlaceholders = topCategories.map(() => "?").join(", ");
    const excludeClause =
      excludeIds.length > 0 ? `AND id NOT IN (${excludeIds.map(() => "?").join(", ")})` : "";
    const params = [...topCategories, ...excludeIds, ...topCategories, limit];

    [rows] = await db.query(
      `SELECT id, name, description, price, image_url, category, stock
       FROM products
       WHERE category IN (${catPlaceholders}) AND stock > 0 ${excludeClause}
       ORDER BY FIELD(category, ${catPlaceholders}), created_at DESC
       LIMIT ?`,
      params
    );
  }

  if (!rows.length) {
    const excludeClause =
      excludeIds.length > 0 ? `WHERE id NOT IN (${excludeIds.map(() => "?").join(", ")})` : "";
    const params = [...excludeIds, limit];
    [rows] = await db.query(
      `SELECT id, name, description, price, image_url, category, stock
       FROM products
       ${excludeClause}
       ORDER BY stock > 0 DESC, created_at DESC
       LIMIT ?`,
      params
    );
  }

  return rows.map((product) => ({
    ...product,
    reason: buildReason(product.category, categoryWeights),
  }));
}

export { parseRecentProductIds };
