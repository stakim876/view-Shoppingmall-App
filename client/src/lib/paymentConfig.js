const PLACEHOLDER_STORE_RE = /^impX+$/i;

export function isMockPaymentEnabled() {
  const flag = String(import.meta.env.VITE_DEV_MOCK_PAYMENT || "").trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;

  const storeId = String(import.meta.env.VITE_PORTONE_STORE_ID || "").trim();
  if (!storeId) return true;
  if (PLACEHOLDER_STORE_RE.test(storeId)) return true;
  if (/your|example|placeholder|xxxx/i.test(storeId)) return true;
  return false;
}

export function getPortOneStoreId() {
  return String(import.meta.env.VITE_PORTONE_STORE_ID || "").trim();
}
