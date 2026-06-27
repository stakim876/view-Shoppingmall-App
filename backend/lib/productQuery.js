import { buildSearchRelevanceSql, buildSearchWhereClause } from "./searchEngine.js";

const SORT_FIELDS = {
  id: "id",
  name: "name",
  price: "price",
  created_at: "created_at",
  popular: "popular",
};

export function buildProductListQuery(rawQuery = {}) {
  const page = Math.max(1, Number.parseInt(rawQuery.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(rawQuery.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const search = (rawQuery.search || "").toString().trim();
  const category = (rawQuery.category || "").toString().trim();
  const minPrice = rawQuery.minPrice != null ? Number(rawQuery.minPrice) : null;
  const maxPrice = rawQuery.maxPrice != null ? Number(rawQuery.maxPrice) : null;
  const rawIds = (rawQuery.ids || "").toString().trim();
  const requestedIds = rawIds
    ? rawIds
        .split(",")
        .map((value) => Number.parseInt(value, 10))
        .filter((id) => Number.isFinite(id) && id > 0)
        .slice(0, 50)
    : [];

  const requestedSortField = (rawQuery.sortBy || "id").toString().trim();
  const sortField = SORT_FIELDS[requestedSortField] || "id";
  const sortOrder = (rawQuery.sortOrder || "desc").toString().toLowerCase() === "asc" ? "ASC" : "DESC";

  const where = [];
  const params = [];

  if (search) {
    const searchWhere = buildSearchWhereClause(search);
    where.push(searchWhere.clause);
    params.push(...searchWhere.params);
  }
  if (category) {
    where.push("category = ?");
    params.push(category);
  }
  if (minPrice != null && !Number.isNaN(minPrice)) {
    where.push("price >= ?");
    params.push(minPrice);
  }
  if (maxPrice != null && !Number.isNaN(maxPrice)) {
    where.push("price <= ?");
    params.push(maxPrice);
  }
  if (requestedIds.length > 0) {
    where.push(`id IN (${requestedIds.map(() => "?").join(", ")})`);
    params.push(...requestedIds);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const prefixProductColumns = (clause) =>
    clause.replace(/\b(name|description|category|price|id|created_at)\b/g, "p.$1");
  const whereWithAlias = where.length > 0
    ? `WHERE ${where.map(prefixProductColumns).join(" AND ")}`
    : "";

  let orderClause = `${sortField} ${sortOrder}`;
  let relevanceParams = [];
  if (search && sortField === "id") {
    const relevance = buildSearchRelevanceSql(search);
    orderClause = `${relevance.expr} DESC, ${sortField} ${sortOrder}`;
    relevanceParams = relevance.params;
  }

  let listSql;
  if (sortField === "popular") {
    listSql = `
      SELECT p.*
      FROM products p
      LEFT JOIN (
        SELECT product_id, COALESCE(SUM(quantity), 0) AS order_qty
        FROM order_items
        GROUP BY product_id
      ) pop ON pop.product_id = p.id
      ${whereWithAlias}
      ORDER BY COALESCE(pop.order_qty, 0) ${sortOrder}, p.id DESC
      LIMIT ? OFFSET ?`;
    orderClause = "popular";
  } else {
    listSql = `SELECT * FROM products ${whereClause} ORDER BY ${orderClause} LIMIT ? OFFSET ?`;
  }

  const countSql = `SELECT COUNT(*) AS total FROM products ${whereClause}`;

  return {
    page,
    limit,
    offset,
    sortField,
    sortOrder,
    whereClause,
    listSql,
    countSql,
    listParams: [...params, ...relevanceParams, limit, offset],
    countParams: params,
    search,
    requestedIds,
    engine: "mysql",
  };
}
