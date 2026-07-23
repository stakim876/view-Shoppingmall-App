import crypto from "crypto";

export function createGuestLookupToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

export function phonesMatch(a, b) {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  return na === nb || na.endsWith(nb) || nb.endsWith(na);
}
