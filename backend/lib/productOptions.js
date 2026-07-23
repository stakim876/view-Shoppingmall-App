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

export function validateSelectedOptions(productOptionsRaw, selectedRaw) {
  const groups = parseProductOptions(productOptionsRaw);
  const selected = normalizeSelectedOptions(selectedRaw);

  if (!groups.length) {
    return {
      ok: true,
      options: {},
      optionsJson: null,
      optionsLabel: "",
    };
  }

  for (const group of groups) {
    const value = selected[group.key];
    if (!value) {
      return {
        ok: false,
        code: "OPTIONS_REQUIRED",
        message: `${group.label}을(를) 선택해 주세요.`,
      };
    }
    if (!group.values.includes(value)) {
      return {
        ok: false,
        code: "INVALID_OPTION",
        message: `${group.label} 선택이 올바르지 않습니다.`,
      };
    }
  }

  const allowedKeys = new Set(groups.map((g) => g.key));
  for (const key of Object.keys(selected)) {
    if (!allowedKeys.has(key)) {
      return {
        ok: false,
        code: "INVALID_OPTION",
        message: "허용되지 않은 옵션이 포함되어 있습니다.",
      };
    }
  }

  const ordered = {};
  for (const group of groups) {
    ordered[group.key] = selected[group.key];
  }

  return {
    ok: true,
    options: ordered,
    optionsJson: JSON.stringify(ordered),
    optionsLabel: formatOptionsLabel(groups, ordered),
  };
}

export const DEMO_PRODUCT_OPTIONS_BY_NAME = {
  "아이폰 15": [
    { key: "color", label: "색상", values: ["블랙", "블루", "핑크", "옐로", "그린"] },
    { key: "storage", label: "용량", values: ["128GB", "256GB", "512GB"] },
  ],
  "맥북 프로": [
    { key: "color", label: "색상", values: ["스페이스 그레이", "실버"] },
    { key: "storage", label: "저장공간", values: ["512GB", "1TB"] },
  ],
  "에어팟 프로": [
    { key: "color", label: "색상", values: ["화이트"] },
  ],
  "애플워치 9": [
    { key: "size", label: "케이스 사이즈", values: ["41mm", "45mm"] },
    { key: "color", label: "밴드 색상", values: ["미드나이트", "스타라이트", "핑크"] },
  ],
  "아이패드 프로": [
    { key: "size", label: "화면 크기", values: ["11인치", "12.9인치"] },
    { key: "storage", label: "용량", values: ["256GB", "512GB", "1TB"] },
    { key: "color", label: "색상", values: ["스페이스 블랙", "실버"] },
  ],
  "뉴발란스 파스텔 스니커즈": [
    { key: "size", label: "사이즈", values: ["230", "240", "250", "260", "270", "280"] },
  ],
  "데님 자켓 & 니트 비니": [
    { key: "size", label: "자켓 사이즈", values: ["S", "M", "L", "XL"] },
    { key: "color", label: "색상", values: ["인디고", "블랙"] },
  ],
  "미니멀 백팩": [
    { key: "color", label: "색상", values: ["블랙", "차콜", "네이비"] },
  ],
  "기본 검정 티셔츠": [
    { key: "size", label: "사이즈", values: ["S", "M", "L", "XL", "XXL"] },
  ],
};
