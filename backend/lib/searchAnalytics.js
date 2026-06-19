export async function recordSearchEvent(db, searchTerm, userId = null) {
  const term = String(searchTerm || "").trim().slice(0, 200);
  if (!term) return;
  await db.query(
    `INSERT INTO search_events (search_term, user_id) VALUES (?, ?)`,
    [term, userId || null]
  );
}

export async function getPopularSearchTerms(db, limit = 10) {
  const safeLimit = Math.min(20, Math.max(1, Number(limit) || 10));
  const [rows] = await db.query(
    `SELECT search_term AS term, COUNT(*) AS count
     FROM search_events
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY search_term
     ORDER BY count DESC, search_term ASC
     LIMIT ?`,
    [safeLimit]
  );
  return rows.map((row) => ({
    term: row.term,
    count: Number(row.count) || 0,
  }));
}
