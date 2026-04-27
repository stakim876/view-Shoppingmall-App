function normalizeBaseUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
}

export function resolveApiConfig() {
  const envBase = normalizeBaseUrl(import.meta.env.VITE_API_URL);
  const defaultBase = "http://localhost:3102/api";
  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const apiBaseUrl = normalizeBaseUrl(isLocalHost ? defaultBase : envBase || defaultBase);
  const apiOrigin = apiBaseUrl.replace(/\/api$/, "");
  return { apiBaseUrl, apiOrigin };
}
