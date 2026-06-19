import { buildSearchRelevanceSql, buildSearchWhereClause } from "./searchEngine.js";

const SORT_FIELDS = {
  id: "id",
  name: "name",
  price: "price",
  created_at: "created_at",
};

export function buildProductListQuery(rawQuery = {}) {
  const page = Math.max(1, Number.parseInt(rawQuery.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(rawQuery.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const search = (rawQuery.search || "").toString().trim();
  const category = (rawQuery.category || "").toString().trim();
  const minPrice = rawQuery.minPrice != null ? Number(rawQuery.minPrice) : null;
  const maxPrice = rawQuery.maxPrice != null ? Number(rawQuery.maxPrice) : null;

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

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  let orderClause = `${sortField} ${sortOrder}`;
  let relevanceParams = [];
  if (search && sortField === "id") {
    const relevance = buildSearchRelevanceSql(search);
    orderClause = `${relevance.expr} DESC, ${sortField} ${sortOrder}`;
    relevanceParams = relevance.params;
  }

  const listSql = `SELECT * FROM products ${whereClause} ORDER BY ${orderClause} LIMIT ? OFFSET ?`;
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
    engine: "mysql",
  };
}
