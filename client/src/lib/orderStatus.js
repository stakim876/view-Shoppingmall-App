export const ORDER_TIMELINE_STEPS = [
  { key: "paid", label: "결제완료" },
  { key: "preparing", label: "상품준비중" },
  { key: "shipping", label: "배송중" },
  { key: "done", label: "배송완료" },
];

export function normalizeOrderStatus(status) {
  const raw = String(status || "").trim().toLowerCase();
  if (raw === "shipped") return "shipping";
  if (raw === "completed" || raw === "delivered") return "done";
  return raw;
}

export function getOrderStatusLabel(status) {
  const key = normalizeOrderStatus(status);
  const map = {
    paid: "결제완료",
    preparing: "상품준비중",
    shipping: "배송중",
    done: "배송완료",
    cancelled: "취소",
  };
  return map[key] || status || "-";
}

export function getOrderStepVariant(orderStatus, stepKey) {
  const status = normalizeOrderStatus(orderStatus);
  if (status === "cancelled") return stepKey === "paid" ? "done" : "pending";

  const rank = { paid: 1, preparing: 2, shipping: 3, done: 4 };
  const oRank = rank[status] || 0;
  const sRank = rank[stepKey] || 0;
  if (oRank === sRank) return "active";
  if (sRank < oRank) return "done";
  return "pending";
}

export function getOrderStepDotClass(variant) {
  if (variant === "done") return "bg-emerald-600 dark:bg-emerald-400";
  if (variant === "active") return "bg-emerald-600 dark:bg-emerald-400 ring-4 ring-emerald-500/15 dark:ring-emerald-400/20";
  return "bg-white/40 dark:bg-white/10";
}

export function getOrderStepTextClass(variant) {
  if (variant === "pending") return "text-gray-500 dark:text-gray-400";
  return "text-gray-800 dark:text-gray-100 font-semibold";
}

export function getOrderStatusBadgeClass(status) {
  const key = normalizeOrderStatus(status);
  const map = {
    paid: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    preparing: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    shipping: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    cancelled: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
  };
  return map[key] || "bg-neutral-100 text-neutral-600";
}
