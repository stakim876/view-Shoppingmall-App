export const CRM_SEGMENT_LABELS = {
  vip: "VIP",
  active: "활성",
  new: "신규",
  dormant: "휴면",
  regular: "일반",
};

const VIP_MIN_SPENT = Number(process.env.CRM_VIP_MIN_SPENT || 500000);
const ACTIVE_DAYS = Number(process.env.CRM_ACTIVE_DAYS || 30);
const NEW_DAYS = Number(process.env.CRM_NEW_DAYS || 14);
const DORMANT_DAYS = Number(process.env.CRM_DORMANT_DAYS || 90);

export function buildCustomerStatsSubquery() {
  return `
    SELECT
      u.id,
      u.email,
      u.name,
      u.gender,
      u.role,
      u.created_at,
      COUNT(DISTINCT o.id) AS order_count,
      COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled') THEN o.total_price ELSE 0 END), 0) AS total_spent,
      MAX(o.created_at) AS last_order_at,
      CASE
        WHEN COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled') THEN o.total_price ELSE 0 END), 0) >= ${VIP_MIN_SPENT} THEN 'vip'
        WHEN MAX(o.created_at) >= DATE_SUB(NOW(), INTERVAL ${ACTIVE_DAYS} DAY) THEN 'active'
        WHEN u.created_at >= DATE_SUB(NOW(), INTERVAL ${NEW_DAYS} DAY) THEN 'new'
        WHEN COUNT(DISTINCT o.id) = 0 AND u.created_at < DATE_SUB(NOW(), INTERVAL ${ACTIVE_DAYS} DAY) THEN 'dormant'
        WHEN MAX(o.created_at) IS NOT NULL AND MAX(o.created_at) < DATE_SUB(NOW(), INTERVAL ${DORMANT_DAYS} DAY) THEN 'dormant'
        ELSE 'regular'
      END AS segment
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    WHERE (u.role IS NULL OR u.role != 'admin')
    GROUP BY u.id, u.email, u.name, u.gender, u.role, u.created_at
  `;
}

export async function getCrmSummary(db) {
  const sub = buildCustomerStatsSubquery();
  const [rows] = await db.query(
    `SELECT
       COUNT(*) AS total_customers,
       SUM(segment = 'vip') AS vip_count,
       SUM(segment = 'active') AS active_count,
       SUM(segment = 'new') AS new_count,
       SUM(segment = 'dormant') AS dormant_count,
       ROUND(AVG(total_spent), 0) AS avg_ltv,
       ROUND(MAX(total_spent), 0) AS max_ltv
     FROM (${sub}) AS customer_stats`
  );
  const row = rows[0] || {};
  return {
    totalCustomers: Number(row.total_customers) || 0,
    vipCount: Number(row.vip_count) || 0,
    activeCount: Number(row.active_count) || 0,
    newCount: Number(row.new_count) || 0,
    dormantCount: Number(row.dormant_count) || 0,
    avgLtv: Number(row.avg_ltv) || 0,
    maxLtv: Number(row.max_ltv) || 0,
  };
}

export async function listCustomers(db, { search = "", segment = "", page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (safePage - 1) * safeLimit;
  const sub = buildCustomerStatsSubquery();

  const where = [];
  const params = [];
  const cleanSearch = String(search || "").trim();
  if (cleanSearch) {
    where.push("(email LIKE ? OR name LIKE ?)");
    params.push(`%${cleanSearch}%`, `%${cleanSearch}%`);
  }
  const cleanSegment = String(segment || "").trim();
  if (cleanSegment && CRM_SEGMENT_LABELS[cleanSegment]) {
    where.push("segment = ?");
    params.push(cleanSegment);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [users] = await db.query(
    `SELECT * FROM (${sub}) AS customer_stats ${whereSql}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  );

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM (${sub}) AS customer_stats ${whereSql}`,
    params
  );
  const total = Number(countRows?.[0]?.total || 0);

  return {
    users,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

export function customersToCsv(users) {
  const header = ["id", "name", "email", "segment", "order_count", "total_spent", "last_order_at", "created_at"];
  const lines = [header.join(",")];
  for (const u of users) {
    const row = [
      u.id,
      csvEscape(u.name),
      csvEscape(u.email),
      csvEscape(CRM_SEGMENT_LABELS[u.segment] || u.segment || ""),
      u.order_count || 0,
      u.total_spent || 0,
      csvEscape(formatCsvDate(u.last_order_at)),
      csvEscape(formatCsvDate(u.created_at)),
    ];
    lines.push(row.join(","));
  }
  return `\uFEFF${lines.join("\n")}`;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatCsvDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export async function exportAllCustomers(db, { search = "", segment = "" } = {}) {
  const batch = await listCustomers(db, { search, segment, page: 1, limit: 10000 });
  return customersToCsv(batch.users);
}
