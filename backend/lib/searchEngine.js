export function buildSearchRelevanceSql(search) {
  const term = String(search || "").trim();
  if (!term) {
    return { expr: "0", params: [] };
  }
  const like = `%${term}%`;
  const prefix = `${term}%`;
  return {
    expr: `(CASE
      WHEN name = ? THEN 100
      WHEN name LIKE ? THEN 80
      WHEN name LIKE ? THEN 70
      WHEN description LIKE ? THEN 40
      WHEN category LIKE ? THEN 20
      ELSE 0
    END)`,
    params: [term, like, prefix, like, like],
  };
}

export function getSearchEngineMode() {
  const url = String(process.env.ELASTICSEARCH_URL || "").trim();
  if (url) return "elasticsearch";
  return "mysql";
}

export function buildSearchWhereClause(search) {
  const term = String(search || "").trim();
  if (!term) {
    return { clause: "", params: [] };
  }
  const like = `%${term}%`;
  return {
    clause: "(name LIKE ? OR description LIKE ? OR category LIKE ?)",
    params: [like, like, like],
  };
}
