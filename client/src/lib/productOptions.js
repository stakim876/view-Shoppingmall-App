export function parseProductOptions(raw) {
  if (raw == null || raw === "") return [];
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(data)) return [];

  return data
    .map((group) => {
      if (!group || typeof group !== "object") return null;
      const key = String(group.key || "").trim();
      const label = String(group.label || key || "").trim();
      const values = Array.isArray(group.values)
        ? group.values.map((v) => String(v).trim()).filter(Boolean)
        : [];
      if (!key || !values.length) return null;
      return { key, label: label || key, values };
    })
    .filter(Boolean);
}

export function normalizeSelectedOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) return {};
  const out = {};
  for (const [key, value] of Object.entries(options)) {
    const k = String(key || "").trim();
    const v = String(value ?? "").trim();
    if (k && v) out[k] = v;
  }
  return out;
}

export function optionsLineKey(productId, options) {
  const normalized = normalizeSelectedOptions(options);
  const keys = Object.keys(normalized).sort();
  const payload = keys.map((k) => `${k}=${normalized[k]}`).join("|");
  return `${Number(productId)}::${payload}`;
}

export function formatOptionsLabel(groups, selected) {
  const normalized = normalizeSelectedOptions(selected);
  if (!Object.keys(normalized).length) return "";
  const labelByKey = new Map((groups || []).map((g) => [g.key, g.label]));
  return Object.keys(normalized)
    .sort()
    .map((key) => `${labelByKey.get(key) || key}: ${normalized[key]}`)
    .join(" / ");
}

export function areAllOptionsSelected(groups, selected) {
  if (!groups?.length) return true;
  const normalized = normalizeSelectedOptions(selected);
  return groups.every((g) => Boolean(normalized[g.key]));
}

export function parseOptionsFromOrderItem(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "object" && !Array.isArray(raw)) return normalizeSelectedOptions(raw);
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return normalizeSelectedOptions(parsed);
  } catch {
    return null;
  }
}
