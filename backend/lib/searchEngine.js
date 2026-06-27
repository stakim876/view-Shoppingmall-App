/*
 * [면접] 검색 관련도 점수
 * Q. 왜 프론트 filter() 대신 서버? → 상품 많아지면 전체 다운로드 부담, WHERE+점수 정렬이 유리
 * Q. 점수? → 이름 완전일치(100) > 포함(80) > 앞글자(70) > 설명(40) > 카테고리(20)
 */
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
