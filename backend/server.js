import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import axios from "axios";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import { hashPassword, verifyPassword, generateToken, authenticateToken, optionalAuthenticate } from "./lib/auth.js";
import { validateCoupon } from "./lib/coupon.js";
import { buildProductListQuery } from "./lib/productQuery.js";
import { recordSearchEvent, getPopularSearchTerms } from "./lib/searchAnalytics.js";
import { getPersonalizedRecommendations, parseRecentProductIds } from "./lib/personalizedRecommend.js";
import { getSearchEngineMode } from "./lib/searchEngine.js";
import {
  isElasticsearchEnabled,
  searchProductsInElasticsearch,
  syncAllProductsToElasticsearch,
  syncProductToElasticsearch,
  removeProductFromElasticsearch,
} from "./lib/elasticsearch.js";
import {
  getCrmSummary,
  listCustomers,
  exportAllCustomers,
  CRM_SEGMENT_LABELS,
} from "./lib/adminCrm.js";
import { buildLoginAttemptKey, createLoginAttemptStore } from "./lib/loginSecurity.js";
import { verifyCaptchaToken } from "./lib/captcha.js";
import { sendPasswordResetEmail, sendRestockAlertEmail } from "./lib/mailer.js";
import { buildTrackingUrl, getCarrierLabel, isValidCarrierCode, listCarriers } from "./lib/tracking.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const FREE_SHIPPING_MIN = Number(process.env.FREE_SHIPPING_MIN || 30000);
const SHIPPING_FEE = Number(process.env.SHIPPING_FEE || 3000);
const WEAK_JWT_SECRETS = new Set([
  "",
  "replace_with_strong_random_secret",
  "changeme",
  "secret",
  "test",
]);

function validateRuntimeSecurityConfig() {
  const jwtSecret = String(process.env.JWT_SECRET || "");
  if (WEAK_JWT_SECRETS.has(jwtSecret.trim()) || jwtSecret.length < 16) {
    console.warn(
      "⚠️ JWT_SECRET 값이 약하거나 기본값입니다. 16자 이상 랜덤 문자열로 교체하세요."
    );
  }

  const corsOriginRaw = String(process.env.CORS_ORIGIN || "").trim();
  if (corsOriginRaw === "*") {
    console.warn("⚠️ CORS_ORIGIN='*' 는 권장되지 않습니다. 허용할 도메인을 명시하세요.");
  }
}

validateRuntimeSecurityConfig();

function calcShippingFee(subtotal) {
  const amount = Number(subtotal || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (amount >= FREE_SHIPPING_MIN) return 0;
  return Number.isFinite(SHIPPING_FEE) && SHIPPING_FEE >= 0 ? SHIPPING_FEE : 0;
}

function ok(res, payload = {}, message = "OK", status = 200) {
  return res.status(status).json({ success: true, message, ...payload });
}

function fail(res, status, code, message, extra = {}) {
  return res.status(status).json({ success: false, code, message, ...extra });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getKstDateString() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

async function recordVisitorPageView() {
  const visitDate = getKstDateString();
  await db.query(
    `INSERT INTO visitor_daily (visit_date, view_count) VALUES (?, 1)
     ON DUPLICATE KEY UPDATE view_count = view_count + 1`,
    [visitDate]
  );
  await db.query(`UPDATE visitor_total SET view_count = view_count + 1 WHERE id = 1`);
}

async function getVisitorStats() {
  const visitDate = getKstDateString();
  let today = 0;
  let total = 0;
  try {
    const [[dailyRow]] = await db.query(
      `SELECT view_count FROM visitor_daily WHERE visit_date = ? LIMIT 1`,
      [visitDate]
    );
    today = Number(dailyRow?.view_count) || 0;
    const [[totalRow]] = await db.query(
      `SELECT view_count FROM visitor_total WHERE id = 1 LIMIT 1`
    );
    total = Number(totalRow?.view_count) || 0;
  } catch (err) {
    if (err.code !== "ER_NO_SUCH_TABLE") throw err;
  }
  return { today, total };
}

function parseOptionalMysqlDatetime(input) {
  if (input == null || input === "") return null;
  const s = String(input).trim();
  if (!s) return null;
  const normalized = s.includes("T") ? s.replace("T", " ") : s;
  if (normalized.length === 16 && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:00`;
  }
  return normalized.slice(0, 19);
}

async function queryPublicNoticesList(dbConn, limit) {
  const cap = limit != null && !Number.isNaN(Number(limit)) ? Math.min(100, Math.max(1, Number(limit))) : null;
  const limitSql = cap ? ` LIMIT ${cap}` : "";
  const sql = `
    SELECT id, title, created_at, priority
    FROM notices
    WHERE is_active = 1
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (ends_at IS NULL OR ends_at >= NOW())
    ORDER BY priority DESC, id DESC
    ${limitSql}`;
  try {
    const [rows] = await dbConn.query(sql);
    return rows;
  } catch (e) {
    if (e.code === "ER_NO_SUCH_TABLE") return [];
    throw e;
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function notifyRestockSubscribers(product) {
  const productId = Number(product?.id);
  if (!productId) return;
  const clientBaseUrl = (process.env.CLIENT_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
  const productUrl = `${clientBaseUrl}/product/${productId}`;

  let subscriptions = [];
  try {
    const [rows] = await db.query(
      `SELECT id, email
       FROM restock_subscriptions
       WHERE product_id = ? AND notified_at IS NULL`,
      [productId]
    );
    subscriptions = rows || [];
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return;
    }
    throw err;
  }
  if (subscriptions.length === 0) return;

  const notifiedIds = [];
  for (const sub of subscriptions) {
    try {
      const mailResult = await sendRestockAlertEmail({
        toEmail: sub.email,
        productName: product.name || "상품",
        productUrl,
      });
      if (mailResult.sent) {
        notifiedIds.push(Number(sub.id));
      } else {
        console.log(`🔔 재입고 알림 메일 미전송(${sub.email}):`, mailResult.reason);
      }
    } catch (mailErr) {
      console.error(`❌ 재입고 알림 메일 발송 실패(${sub.email}):`, mailErr.message);
    }
  }

  if (notifiedIds.length > 0) {
    const placeholders = notifiedIds.map(() => "?").join(", ");
    await db.query(
      `UPDATE restock_subscriptions
       SET notified_at = NOW()
       WHERE id IN (${placeholders})`,
      notifiedIds
    );
  }
}

const PRODUCT_CACHE_TTL_MS = Number(process.env.PRODUCT_CACHE_TTL_MS || 60000);
const responseCache = new Map();
const loginAttempts = createLoginAttemptStore();
const resetTokens = new Map();
const RESET_TOKEN_TTL_MS = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MS || 30 * 60 * 1000);

function cacheKey(prefix, query = {}) {
  const entries = Object.entries(query).sort(([a], [b]) => a.localeCompare(b));
  return `${prefix}:${JSON.stringify(entries)}`;
}

function getCache(key) {
  const cached = responseCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return cached.value;
}

function setCache(key, value) {
  responseCache.set(key, { value, expiresAt: Date.now() + PRODUCT_CACHE_TTL_MS });
}

function clearProductCache() {
  for (const key of responseCache.keys()) {
    if (key.startsWith("products:") || key.startsWith("categories:")) {
      responseCache.delete(key);
    }
  }
}

function makeResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashResetToken(rawToken) {
  return crypto.createHash("sha256").update(String(rawToken)).digest("hex");
}

function saveResetToken(userId, rawToken) {
  const tokenHash = hashResetToken(rawToken);
  resetTokens.set(tokenHash, {
    userId,
    expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
  });
}

function consumeResetToken(rawToken) {
  const tokenHash = hashResetToken(rawToken);
  const tokenData = resetTokens.get(tokenHash);
  if (!tokenData) return null;
  if (Date.now() > tokenData.expiresAt) {
    resetTokens.delete(tokenHash);
    return null;
  }
  resetTokens.delete(tokenHash);
  return tokenData;
}

const clientImages = path.join(__dirname, "../client/public/images");
app.use("/images", express.static(clientImages));

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : (origin, cb) => {
      if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) cb(null, origin);
      else cb(null, false);
    };
app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function openAiChatCompletion(prompt, apiKey) {
  const maxTokens = Math.min(800, Math.max(64, Number(process.env.OPENAI_MAX_TOKENS || 350)));
  const payload = {
    model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
              process.env.OPENAI_SYSTEM_PROMPT ||
              "당신은 쇼핑몰 쇼핑 도움말 담당입니다. 배송·교환·상품 문의에 친절하고 간결하게 답합니다. 답변에 이모지는 사용하지 마세요.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
  };
  const maxAttempts = Number(process.env.OPENAI_RETRY_ATTEMPTS || 4);
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { data } = await axios.post("https://api.openai.com/v1/chat/completions", payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 45000,
      });
      return data;
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      if (status === 429 && attempt < maxAttempts - 1) {
        const ra = parseInt(String(err.response?.headers?.["retry-after"] || ""), 10);
        const waitMs = Number.isFinite(ra) && ra > 0 ? ra * 1000 : Math.min(12000, 1200 * 2 ** attempt);
        console.warn(`⏳ OpenAI 429, ${waitMs}ms 후 재시도 (${attempt + 1}/${maxAttempts})`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/** OpenAI 미설정·한도·오류 시에도 쇼핑몰 데모가 끊기지 않도록 고정 안내 문구 */
function shoppingHelpFallback(userMessage) {
  const t = String(userMessage || "").trim();
  const lower = t.toLowerCase();

  if (/배송|택배|송장|배송지|언제\s*와|도착/.test(t)) {
    return [
      "배송은 이렇게 진행됩니다.",
      "",
      "• 결제가 완료되면 상품 준비 후 택배로 발송됩니다.",
      "• 발송이 되면 주문 상세에서 택배사·송장 번호를 확인할 수 있습니다. 비회원이시면 상단 메뉴의 「주문/배송 조회」에서도 조회할 수 있습니다.",
      "• 배송지는 주문 시 입력한 주소로 보내드리니, 오타가 없는지 한 번 더 확인해 주세요.",
      "",
      "배송 지연·오배송 등 급한 문의는 푸터의 카카오 문의로 연락 주시면 빠르게 도와드리겠습니다.",
    ].join("\n");
  }

  if (/교환|반품|환불|취소/.test(t)) {
    return [
      "교환·반품·환불은 아래를 참고해 주세요.",
      "",
      "• 단순 변심: 상품 수령 후 일정 기간 내 미개봉·미사용 상태에서 가능한 경우가 많습니다. (카테고리·상품에 따라 상이할 수 있습니다.)",
      "• 불량·오배송: 수령 직후 고객센터로 사진과 함께 연락 주시면 안내해 드립니다.",
      "",
      "정확한 조건과 절차는 푸터의 카카오 문의로 문의 주시면 주문 내역을 확인한 뒤 안내해 드립니다.",
    ].join("\n");
  }

  if (/주문\s*조회|배송\s*조회|주문번호|조회/.test(t) || /order-lookup/.test(lower)) {
    return [
      "주문·배송 조회 방법입니다.",
      "",
      "• 로그인하셨다면 「마이페이지」에서 주문 목록을 확인할 수 있습니다.",
      "• 비회원이시거나 링크가 필요하면 상단/푸터의 주문/배송 조회 메뉴를 이용해 주세요.",
      "",
      "조회가 되지 않으면 푸터 카카오 문의로 주문자명·연락처를 알려 주시면 도와드리겠습니다.",
    ].join("\n");
  }

  if (/결제|카드|포트원|imp_|환불/.test(t) || /payment/.test(lower)) {
    return [
      "결제 관련 안내입니다.",
      "",
      "• 결제는 체크아웃 화면에서 안내되는 결제 수단으로 진행됩니다.",
      "• 결제 완료 후 주문 내역에서 상태를 확인할 수 있습니다.",
      "• 결제 오류·취소 확인이 필요하면 푸터 카카오 문의로 결제 시각과 증상을 남겨 주세요.",
    ].join("\n");
  }

  if (/쿠폰|할인|프로모/.test(t)) {
    return [
      "쿠폰·할인 안내입니다.",
      "",
      "• 장바구니 또는 결제 단계에서 사용 가능한 쿠폰이 있으면 입력·적용할 수 있습니다.",
      "• 쿠폰마다 최소 주문 금액·사용 기한이 다를 수 있습니다.",
      "• 적용이 안 되면 푸터 카카오 문의로 쿠폰 코드를 알려 주시면 확인해 드립니다.",
    ].join("\n");
  }

  if (/문의|고객|연락|전화|카카오/.test(t)) {
    return [
      "고객 문의 방법입니다.",
      "",
      "• 푸터 카카오 문의로 배송·교환·상품 문의를 남겨 주세요.",
      "• 고객센터 운영 시간은 푸터에 안내되어 있습니다.",
      "",
      "긴급한 주문·결제 문제는 카카오 문의에 주문번호 또는 주문자 정보를 함께 적어 주시면 빠르게 처리할 수 있습니다.",
    ].join("\n");
  }

  return [
    "Myshop 쇼핑 도움말입니다.",
    "",
    "• 상품은 「상품」 메뉴에서 검색·필터로 찾을 수 있습니다.",
    "• 장바구니에 담은 뒤 결제하면 주문이 완료됩니다.",
    "• 배송·송장은 마이페이지 또는 주문/배송 조회에서 확인할 수 있습니다.",
    "",
    "배송 일정, 교환·반품, 결제 오류 등 구체적인 내용은 푸터 카카오 문의로 질문을 남겨 주시면 순서대로 답변드립니다.",
  ].join("\n");
}

/** DB products.category 에 실제로 쓰는 값 (시드·관리자 등록 기준) */
const DB_PRODUCT_CATEGORIES = ["디지털/가전", "악세서리", "패션잡화", "의류", "기타"];

/** 자연어·OpenAI 응답 → DB 카테고리 별칭 (소문자 키) */
const CATEGORY_ALIAS_TO_DB = {
  노트북: "디지털/가전",
  맥북: "디지털/가전",
  laptop: "디지털/가전",
  notebook: "디지털/가전",
  태블릿: "디지털/가전",
  아이패드: "디지털/가전",
  tablet: "디지털/가전",
  ipad: "디지털/가전",
  이어폰: "악세서리",
  에어팟: "악세서리",
  헤드폰: "악세서리",
  audio: "악세서리",
  백팩: "악세서리",
  배낭: "악세서리",
  가방: "악세서리",
  backpack: "악세서리",
  액세서리: "악세서리",
  악세사리: "악세서리",
  accessory: "악세서리",
  accessories: "악세서리",
  시계: "디지털/가전",
  워치: "디지털/가전",
  watch: "디지털/가전",
  폰: "디지털/가전",
  아이폰: "디지털/가전",
  스마트폰: "디지털/가전",
  phone: "디지털/가전",
  iphone: "디지털/가전",
  디지털: "디지털/가전",
  가전: "디지털/가전",
  "디지털/가전": "디지털/가전",
  데님: "의류",
  denim: "의류",
  자켓: "의류",
  jacket: "의류",
  코트: "의류",
  티셔츠: "의류",
  셔츠: "의류",
  니트: "의류",
  비니: "의류",
  의류: "의류",
  옷: "의류",
  패션: "의류",
  코디: "의류",
  캐주얼: "의류",
  스니커즈: "패션잡화",
  운동화: "패션잡화",
  신발: "패션잡화",
  sneaker: "패션잡화",
  shoes: "패션잡화",
  패션잡화: "패션잡화",
  잡화: "패션잡화",
  기타: "기타",
};

/** 문장 패턴 → DB 카테고리 (앞쪽 규칙이 우선) */
const CATEGORY_INFER_RULES = [
  { category: "악세서리", pattern: /백팩|배낭|가방|backpack/i },
  { category: "악세서리", pattern: /이어폰|에어팟|헤드폰|earphone|buds/i },
  { category: "악세서리", pattern: /액세서리|악세사리|accessory/i },
  { category: "악세서리", pattern: /선물용|선물/i },
  { category: "의류", pattern: /데님|denim|자켓|jacket|코트|티셔츠|t-?shirt|니트|비니|의류|캐주얼\s*코디|코디/i },
  { category: "패션잡화", pattern: /스니커즈|운동화|신발|sneaker|shoes/i },
  { category: "디지털/가전", pattern: /노트북|맥북|laptop|notebook/i },
  { category: "디지털/가전", pattern: /태블릿|아이패드|tablet|ipad/i },
  { category: "디지털/가전", pattern: /아이폰|스마트폰|iphone|smartphone|phone/i },
  { category: "디지털/가전", pattern: /애플워치|워치|watch|시계/i },
  { category: "디지털/가전", pattern: /디지털|가전|전자/i },
];

/** name/description LIKE 검색용 핵심 키워드 추출 */
const PRODUCT_KEYWORD_HINTS = [
  [/백팩|배낭|backpack/i, "백팩"],
  [/데님|denim/i, "데님"],
  [/자켓|jacket/i, "자켓"],
  [/니트|비니/i, "니트"],
  [/스니커즈|운동화|sneaker/i, "스니커즈"],
  [/티셔츠|t-?shirt/i, "티셔츠"],
  [/에어팟|이어폰|헤드폰/i, "에어팟"],
  [/아이패드|태블릿|tablet/i, "아이패드"],
  [/맥북|노트북|laptop/i, "맥북"],
  [/아이폰|iphone/i, "아이폰"],
  [/애플워치|watch/i, "워치"],
  [/선물/i, "선물"],
  [/출퇴근|commute/i, "출퇴근"],
  [/미니멀|minimal/i, "미니멀"],
];

function resolveCategoryAlias(raw) {
  const c = String(raw || "").trim();
  if (!c) return null;
  if (DB_PRODUCT_CATEGORIES.includes(c)) return c;
  const fromMap = CATEGORY_ALIAS_TO_DB[c] || CATEGORY_ALIAS_TO_DB[c.toLowerCase()];
  if (fromMap) return fromMap;
  return c;
}

function extractProductKeywords(text) {
  const t = String(text || "");
  const hits = [];
  for (const [pattern, keyword] of PRODUCT_KEYWORD_HINTS) {
    if (pattern.test(t)) hits.push(keyword);
  }
  return hits;
}

function parseBudgetFromText(text) {
  const t = String(text || "").replace(/,/g, "");
  const manWonMatch = t.match(/(\d+(?:\.\d+)?)\s*만\s*(?:원)?(?:\s*대|이하|이내|까지)?/);
  if (manWonMatch) {
    return Math.round(Number(manWonMatch[1]) * 10000);
  }
  const rawMatch = t.match(/(\d{4,})\s*원?(?:\s*대|이하|이내|까지)?/);
  if (rawMatch) {
    return Number(rawMatch[1]);
  }
  return null;
}

function inferCategoryFromText(text) {
  const t = String(text || "");
  for (const rule of CATEGORY_INFER_RULES) {
    if (rule.pattern.test(t)) return rule.category;
  }
  return null;
}

function normalizeDbCategory(category) {
  if (!category) return null;
  const resolved = resolveCategoryAlias(category);
  if (DB_PRODUCT_CATEGORIES.includes(resolved)) return resolved;
  const inferred = inferCategoryFromText(resolved);
  if (inferred) return inferred;
  return null;
}

function buildRecommendKeywords(prompt, category) {
  const fromHints = extractProductKeywords(prompt);
  const split = String(prompt || "")
    .split(/[\s,./·|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .filter((s) => !/^\d+(?:\.\d+)?$/.test(s))
    .filter((s) => !/^(만|원|원대|이하|이상|대|내|까지|용|좀|추천|해줘|주세요|원하|찾|고)$/i.test(s));
  const merged = [...fromHints, ...split];
  return [...new Set(merged)].slice(0, 8);
}

function buildRecommendSummary(prompt, intent, count) {
  const parts = [];
  if (intent?.budgetMax) {
    parts.push(`예산 ${Number(intent.budgetMax).toLocaleString("ko-KR")}원 이하`);
  }
  if (intent?.category) {
    parts.push(`${intent.category} 카테고리`);
  }
  if (Array.isArray(intent?.keywords) && intent.keywords.length) {
    parts.push(`키워드 ${intent.keywords.slice(0, 3).join(", ")}`);
  }
  const conditionText = parts.length ? parts.join(" · ") : "입력하신 조건";
  return `${conditionText}에 맞춰 등록 상품 ${count}개를 골랐습니다. (DB에 없는 상품은 추천하지 않습니다)`;
}

async function getAiRecommendStatsForAdmin() {
  const kstDate = getKstDateString();
  const empty = {
    todayRequests: 0,
    todayImpressions: 0,
    todayClicks: 0,
    todayCartAdds: 0,
    clickRate: 0,
    cartRate: 0,
    topPrompts: [],
  };

  try {
    const [counts] = await db.query(
      `SELECT event_name, COUNT(*) AS cnt
       FROM ai_recommend_events
       WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ?
       GROUP BY event_name`,
      [kstDate]
    );

    const byName = Object.fromEntries(
      (counts || []).map((row) => [String(row.event_name), Number(row.cnt) || 0])
    );
    const todayRequests = byName.ai_recommend_request || 0;
    const todayImpressions = byName.ai_recommend_impression || 0;
    const todayClicks = byName.ai_recommend_click || 0;
    const todayCartAdds = byName.ai_recommend_add_to_cart || 0;
    const clickRate =
      todayImpressions > 0 ? Math.round((todayClicks / todayImpressions) * 1000) / 10 : 0;
    const cartRate =
      todayClicks > 0 ? Math.round((todayCartAdds / todayClicks) * 1000) / 10 : 0;

    const [promptRows] = await db.query(
      `SELECT prompt_text, COUNT(*) AS cnt
       FROM ai_recommend_events
       WHERE event_name = 'ai_recommend_request'
         AND prompt_text IS NOT NULL
         AND prompt_text <> ''
         AND DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ?
       GROUP BY prompt_text
       ORDER BY cnt DESC, prompt_text ASC
       LIMIT 5`,
      [kstDate]
    );

    return {
      todayRequests,
      todayImpressions,
      todayClicks,
      todayCartAdds,
      clickRate,
      cartRate,
      topPrompts: (promptRows || []).map((row) => ({
        prompt: String(row.prompt_text),
        count: Number(row.cnt) || 0,
      })),
    };
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") return empty;
    throw err;
  }
}

async function extractRecommendIntent(prompt, apiKey) {
  const budget = parseBudgetFromText(prompt);
  const category = inferCategoryFromText(prompt);
  const keywords = buildRecommendKeywords(prompt, category);

  if (!apiKey) {
    return { budget, category, keywords };
  }

  const categoryList = DB_PRODUCT_CATEGORIES.join(", ");
  const intentPrompt = [
    "사용자 쇼핑 요청을 JSON으로 구조화하세요.",
    "반드시 JSON만 출력: {\"budgetMax\": number|null, \"category\": string|null, \"keywords\": string[]}",
    `category는 반드시 다음 DB 카테고리 중 하나 또는 null: ${categoryList}`,
    "예: 백팩·가방·에어팟 → 악세서리, 데님·자켓·코디 → 의류, 스니커즈·신발 → 패션잡화, 태블릿·노트북·아이폰 → 디지털/가전",
    "keywords에는 상품명 검색에 쓸 핵심 단어(백팩, 데님, 태블릿 등)를 넣으세요.",
    `사용자 입력: ${String(prompt || "").trim()}`,
  ].join("\n");

  try {
    const data = await openAiChatCompletion(intentPrompt, apiKey);
    const content = data?.choices?.[0]?.message?.content?.trim() || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    const parsedCategory = normalizeDbCategory(parsed?.category) || category;
    const parsedKeywords = Array.isArray(parsed?.keywords)
      ? parsed.keywords.map((k) => String(k).trim()).filter(Boolean)
      : keywords;
    return {
      budget: Number.isFinite(Number(parsed?.budgetMax)) ? Number(parsed.budgetMax) : budget,
      category: parsedCategory,
      keywords: buildRecommendKeywords(
        [prompt, ...parsedKeywords].join(" "),
        parsedCategory
      ),
    };
  } catch {
    return { budget, category, keywords };
  }
}

function normalizeRecommendKeywords(keywords, category) {
  const base = Array.isArray(keywords) ? keywords : [];
  const categoryOnlyWords = new Set([
    "노트북", "맥북", "laptop", "notebook",
    "태블릿", "아이패드", "tablet", "ipad",
    "이어폰", "에어팟", "헤드폰", "audio",
    "시계", "워치", "watch",
    "폰", "아이폰", "스마트폰", "phone", "iphone",
    "디지털", "가전", "의류", "패션", "잡화", "패션잡화", "액세서리", "악세사리",
    "선물", "선물용", "코디", "캐주얼",
  ]);
  const cleaned = base
    .map((k) => String(k || "").trim())
    .filter(Boolean)
    .filter((k) => !categoryOnlyWords.has(k.toLowerCase()));
  if (!cleaned.length && category) {
    return extractProductKeywords(base.join(" ")).slice(0, 5);
  }
  if (!cleaned.length) return base.slice(0, 5);
  return cleaned.slice(0, 5);
}

app.post("/api/ai/chat", async (req, res) => {
  const prompt = String(req.body?.message || "").trim();
  if (!prompt) {
    return res.status(400).json({ text: "질문을 입력해 주세요." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.json({ text: shoppingHelpFallback(prompt), fallback: true });
  }

  try {
    const data = await openAiChatCompletion(prompt, apiKey);
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (text) {
      return res.json({ text });
    }
    return res.json({ text: shoppingHelpFallback(prompt), fallback: true });
  } catch (err) {
    console.error("OpenAI API 오류 (폴백 응답 사용):", err.response?.data || err.message);
    return res.json({ text: shoppingHelpFallback(prompt), fallback: true });
  }
});

app.post("/api/ai/recommend", async (req, res) => {
  const prompt = String(req.body?.prompt || "").trim();
  if (!prompt) {
    return res.status(400).json({ success: false, message: "추천 요청 문장을 입력해 주세요." });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const intent = await extractRecommendIntent(prompt, apiKey);
    const budgetMax = Number.isFinite(intent.budget) ? Number(intent.budget) : null;
    const category = normalizeDbCategory(intent.category || null);
    const keywords = normalizeRecommendKeywords(intent.keywords, category);

    const where = [];
    const params = [];
    if (budgetMax != null && budgetMax > 0) {
      where.push("price <= ?");
      params.push(budgetMax);
    }
    if (category) {
      where.push("category = ?");
      params.push(category);
    }
    const keywordClauses = [];
    for (const kw of keywords.slice(0, 5)) {
      keywordClauses.push("(name LIKE ? OR description LIKE ? OR category LIKE ?)");
      params.push(`%${kw}%`, `%${kw}%`, `%${kw}%`);
    }
    if (keywordClauses.length > 0) {
      // 키워드가 여러 개일 때 전부 AND로 묶으면 결과가 과도하게 비어 fallback이 자주 발생하므로 OR로 완화
      where.push(`(${keywordClauses.join(" OR ")})`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    let [rows] = await db.query(
      `SELECT id, name, description, price, image_url, category, stock
       FROM products
       ${whereSql}
       ORDER BY stock > 0 DESC, price ASC
       LIMIT 6`,
      params
    );

    if (!rows.length) {
      [rows] = await db.query(
        `SELECT id, name, description, price, image_url, category, stock
         FROM products
         ORDER BY stock > 0 DESC, created_at DESC, id DESC
         LIMIT 6`
      );
    }

    const recommendations = rows.map((p) => {
      const reasons = [];
      if (budgetMax != null && Number(p.price) <= budgetMax) {
        reasons.push(`예산 ${budgetMax.toLocaleString("ko-KR")}원 이하`);
      }
      if (category && p.category === category) {
        reasons.push(`요청 카테고리(${category}) 일치`);
      }
      const matchedKw = keywords.find(
        (kw) =>
          kw &&
          (String(p.name || "").includes(kw) ||
            String(p.description || "").includes(kw))
      );
      if (matchedKw) {
        reasons.push(`「${matchedKw}」 관련 상품`);
      }
      if (Number(p.stock || 0) > 0) {
        reasons.push("현재 구매 가능");
      }
      if (!reasons.length) reasons.push("요청 조건과 유사한 상품");
      return { ...p, reasons: reasons.slice(0, 2) };
    });

    return res.json({
      success: true,
      message: "AI 추천 결과입니다.",
      summary: buildRecommendSummary(prompt, { budgetMax, category, keywords }, recommendations.length),
      intent: {
        budgetMax,
        category,
        keywords,
      },
      recommendations,
    });
  } catch (err) {
    console.error("❌ AI 추천 오류:", err);
    return res.status(500).json({ success: false, message: "추천 결과를 불러오지 못했습니다." });
  }
});

function buildMysqlPoolConfig() {
  const config = {
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    user: process.env.DB_USER || process.env.MYSQLUSER,
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    database:
      process.env.DB_NAME ||
      process.env.MYSQLDATABASE ||
      process.env.MYSQL_DATABASE,
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  const sslFlag = process.env.DB_SSL;
  if (sslFlag === "true" || sslFlag === "1") {
    const rejectUnauthorized =
      process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false";
    config.ssl = { rejectUnauthorized };
  }

  return config;
}

const mysqlConfig = buildMysqlPoolConfig();

console.log("DB CONFIG CHECK", {
  resolvedHost: mysqlConfig.host,
  resolvedDatabase: mysqlConfig.database,
  resolvedPort: mysqlConfig.port,
  sslEnabled: Boolean(mysqlConfig.ssl),
});

const db = mysql.createPool(mysqlConfig);

console.log("✅ MySQL Connection Pool 생성 완료");

async function ensureReviewAndGalleryTables() {
  try {

     await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(
      `CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product_id (product_id),
        CONSTRAINT fk_product_images_product
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    await db.query(
      `CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        rating TINYINT NOT NULL COMMENT '1~5',
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reviews_product_id (product_id),
        INDEX idx_reviews_user_id (user_id),
        CONSTRAINT fk_reviews_product
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        CONSTRAINT fk_reviews_user
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    await db.query(
      `CREATE TABLE IF NOT EXISTS ai_recommend_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        event_name VARCHAR(40) NOT NULL,
        prompt_text TEXT NULL,
        product_id INT NULL,
        source VARCHAR(40) NULL,
        session_id VARCHAR(100) NULL,
        user_id INT NULL,
        meta_json JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ai_recommend_events_name_created (event_name, created_at),
        INDEX idx_ai_recommend_events_product_created (product_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    await db.query(
      `CREATE TABLE IF NOT EXISTS search_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        search_term VARCHAR(200) NOT NULL,
        user_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_search_term_created (search_term, created_at),
        INDEX idx_search_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    await db.query(
      `CREATE TABLE IF NOT EXISTS visitor_daily (
        visit_date DATE NOT NULL PRIMARY KEY,
        view_count INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    await db.query(
      `CREATE TABLE IF NOT EXISTS visitor_total (
        id TINYINT NOT NULL PRIMARY KEY DEFAULT 1,
        view_count BIGINT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    await db.query(`INSERT IGNORE INTO visitor_total (id, view_count) VALUES (1, 0)`);

    console.log("✅ 리뷰/갤러리 테이블 점검 완료");
  } catch (err) {
    console.warn("⚠️ 리뷰/갤러리 테이블 자동 생성 실패:", err.message);
  }
}

/** Railway 등에서 SQL 붙여넣기가 불안할 때: Variables에 ADMIN_BOOTSTRAP_* 넣고 재배포 후 로그인, 그다음 변수 제거 */
async function bootstrapAdminFromEnv() {
  const rawEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const plain = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!rawEmail || !plain) return;
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email) || String(plain).length < 8) {
    console.warn("⚠️ ADMIN_BOOTSTRAP_* 가 있으나 이메일 형식 또는 비밀번호(8자+)가 아니어서 건너뜁니다.");
    return;
  }
  const name = process.env.ADMIN_BOOTSTRAP_NAME || "관리자";
  try {
    const hashed = await hashPassword(plain);
    const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (rows.length > 0) {
      await db.query("UPDATE users SET password = ?, role = 'admin' WHERE email = ?", [hashed, email]);
    } else {
      await db.query(
        "INSERT INTO users (email, password, name, gender, role) VALUES (?, ?, ?, ?, ?)",
        [email, hashed, name, "male", "admin"]
      );
    }
    console.log(
      `✅ ADMIN_BOOTSTRAP 적용: ${email} → 로그인 후 Railway Variables 에서 ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD 를 삭제하세요.`
    );
  } catch (e) {
    console.warn("⚠️ ADMIN_BOOTSTRAP 적용 실패:", e.message);
  }
}

(async () => {
  try {
    const [rows] = await db.query("SELECT 1 AS ok");
    console.log("✅ DB 연결 테스트 OK:", rows[0]);
    await ensureReviewAndGalleryTables();
    await bootstrapAdminFromEnv();
    if (isElasticsearchEnabled()) {
      try {
        const { synced } = await syncAllProductsToElasticsearch(db);
        console.log(`✅ Elasticsearch 동기화 완료 (${synced}건, ${getSearchEngineMode()})`);
      } catch (err) {
        console.warn("⚠️ Elasticsearch 동기화 실패 — MySQL 검색으로 fallback:", err.message);
      }
    } else {
      console.log(`ℹ️ 검색 엔진: MySQL (관련도 순). ES 사용 시 ELASTICSEARCH_URL 설정`);
    }
  } catch (e) {
    console.error("❌ DB 연결 테스트 실패:", e.message);
  }
})();

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API 서버 정상" });
});

app.get("/api/health/db", async (req, res) => {
  try {
    await db.query("SELECT 1 AS ok");
    return res.json({
      ok: true,
      message: "API+DB 정상",
      uptimeSec: Math.round(process.uptime()),
    });
  } catch (err) {
    console.error("❌ /api/health/db 오류:", err.message);
    return res.status(500).json({
      ok: false,
      message: "DB 연결 실패",
    });
  }
});

app.get("/api/shipping/carriers", (req, res) => {
  res.json({ success: true, carriers: listCarriers() });
});

app.get("/api/notices", async (req, res) => {
  const limit = req.query.limit != null ? req.query.limit : null;
  try {
    const notices = await queryPublicNoticesList(db, limit);
    return ok(res, { notices });
  } catch (err) {
    console.error("공지 목록 오류:", err);
    return fail(res, 500, "NOTICE_LIST_ERROR", "공지 목록을 불러오지 못했습니다.");
  }
});

app.get("/api/notices/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return fail(res, 400, "INVALID_ID", "잘못된 공지 ID입니다.");
  try {
    const [rows] = await db.query(
      `SELECT id, title, body, created_at, priority
       FROM notices
       WHERE id = ?
         AND is_active = 1
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (ends_at IS NULL OR ends_at >= NOW())`,
      [id]
    );
    const notice = rows?.[0];
    if (!notice) return fail(res, 404, "NOT_FOUND", "공지를 찾을 수 없습니다.");
    return ok(res, { notice });
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return fail(res, 404, "NOT_FOUND", "공지를 찾을 수 없습니다.");
    }
    console.error("공지 상세 오류:", err);
    return fail(res, 500, "NOTICE_DETAIL_ERROR", "공지를 불러오지 못했습니다.");
  }
});

app.post("/api/analytics/auth-events", (req, res) => {
  const { eventName, meta, createdAt } = req.body || {};
  if (!eventName) {
    return fail(res, 400, "INVALID_EVENT", "eventName은 필수입니다.");
  }
  console.log("📊 auth-event", {
    eventName,
    createdAt: createdAt || new Date().toISOString(),
    meta: meta || {},
    ip: req.ip,
  });
  return ok(res, {}, "auth event recorded");
});

app.get("/api/analytics/visitor-stats", async (_req, res) => {
  try {
    const stats = await getVisitorStats();
    return ok(res, stats, "visitor stats");
  } catch (err) {
    console.error("방문자 통계 조회 오류:", err);
    return fail(res, 500, "VISITOR_STATS_ERROR", "방문자 통계를 불러오지 못했습니다.");
  }
});

app.post("/api/analytics/page-views", async (_req, res) => {
  try {
    await recordVisitorPageView();
    const stats = await getVisitorStats();
    return ok(res, stats, "page view recorded");
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return ok(res, { today: 0, total: 0 }, "page view recorded");
    }
    console.error("방문자 집계 오류:", err);
    return fail(res, 500, "PAGE_VIEW_ERROR", "방문 기록에 실패했습니다.");
  }
});

app.post("/api/analytics/search-events", async (req, res) => {
  const searchTerm = String(req.body?.searchTerm || req.body?.term || "").trim();
  if (!searchTerm) {
    return fail(res, 400, "INVALID_SEARCH", "검색어를 입력해 주세요.");
  }
  const userId = req.body?.userId != null ? Number(req.body.userId) : null;
  try {
    await recordSearchEvent(db, searchTerm, Number.isFinite(userId) ? userId : null);
    return ok(res, {}, "search event recorded");
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return fail(
        res,
        503,
        "SCHEMA_MISSING",
        "search_events 테이블이 없습니다. 서버를 재시작해 자동 생성을 실행하세요."
      );
    }
    console.error("검색 이벤트 기록 오류:", err);
    return fail(res, 500, "SEARCH_EVENT_ERROR", "검색 이벤트 기록에 실패했습니다.");
  }
});

app.get("/api/search/popular", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const terms = await getPopularSearchTerms(db, limit);
    return ok(res, { terms, engine: getSearchEngineMode() }, "popular search terms");
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return ok(res, { terms: [], engine: getSearchEngineMode() }, "popular search terms");
    }
    console.error("인기 검색어 조회 오류:", err);
    return fail(res, 500, "POPULAR_SEARCH_ERROR", "인기 검색어를 불러오지 못했습니다.");
  }
});

async function queryProductList(rawQuery = {}) {
  if (String(rawQuery.search || "").trim() && isElasticsearchEnabled()) {
    try {
      const esResult = await searchProductsInElasticsearch(rawQuery);
      if (esResult) return esResult;
    } catch (err) {
      console.warn("Elasticsearch 검색 실패 — MySQL fallback:", err.message);
    }
  }

  const query = buildProductListQuery(rawQuery);
  const [results] = await db.query(query.listSql, query.listParams);
  const [countRows] = await db.query(query.countSql, query.countParams);
  const total = Number(countRows?.[0]?.total || 0);
  return {
    items: results,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
    engine: query.engine,
  };
}

app.get("/api/search", async (req, res) => {
  const search = String(req.query.q || req.query.search || "").trim();
  if (!search) {
    return fail(res, 400, "INVALID_SEARCH", "검색어를 입력해 주세요.");
  }
  try {
    const result = await queryProductList({
      ...req.query,
      search,
      withMeta: "1",
    });
    const [suggestions] = await db.query(
      `SELECT search_term AS term, COUNT(*) AS count
       FROM search_events
       WHERE search_term LIKE ?
       GROUP BY search_term
       ORDER BY count DESC
       LIMIT 5`,
      [`%${search}%`]
    ).catch(() => [[]]);

    return ok(res, {
      ...result,
      query: search,
      suggestions: suggestions || [],
    });
  } catch (err) {
    console.error("검색 API 오류:", err);
    return fail(res, 500, "SEARCH_ERROR", "검색에 실패했습니다.");
  }
});

app.get("/api/recommendations/personalized", optionalAuthenticate, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const recentProductIds = parseRecentProductIds(req.query.recentProductIds);
    const limit = Number(req.query.limit) || 6;

    if (!userId && recentProductIds.length === 0) {
      return ok(res, { recommendations: [], summary: "로그인하거나 상품을 둘러보면 맞춤 추천을 제공합니다." });
    }

    const recommendations = await getPersonalizedRecommendations(db, userId, {
      recentProductIds,
      limit,
    });

    const summary =
      recommendations.length > 0
        ? `구매·찜·최근 본 상품을 바탕으로 ${recommendations.length}개를 골랐습니다.`
        : "추천할 상품이 없습니다.";

    return ok(res, { recommendations, summary });
  } catch (err) {
    console.error("개인화 추천 오류:", err);
    return fail(res, 500, "PERSONALIZED_RECOMMEND_ERROR", "맞춤 추천을 불러오지 못했습니다.");
  }
});

app.post("/api/analytics/ai-recommend-events", async (req, res) => {
  const { eventName, promptText, productId, source, sessionId, userId, meta } = req.body || {};
  const allowed = new Set([
    "ai_recommend_request",
    "ai_recommend_impression",
    "ai_recommend_click",
    "ai_recommend_add_to_cart",
  ]);
  if (!eventName || !allowed.has(String(eventName))) {
    return fail(res, 400, "INVALID_EVENT", "유효하지 않은 AI 추천 이벤트입니다.");
  }

  try {
    await db.query(
      `INSERT INTO ai_recommend_events
      (event_name, prompt_text, product_id, source, session_id, user_id, meta_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        String(eventName),
        promptText ? String(promptText) : null,
        Number(productId) > 0 ? Number(productId) : null,
        source ? String(source) : "home_ai_widget",
        sessionId ? String(sessionId) : null,
        Number(userId) > 0 ? Number(userId) : null,
        meta ? JSON.stringify(meta) : null,
      ]
    );
    return ok(res, {}, "ai recommend event recorded");
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return fail(
        res,
        503,
        "SCHEMA_MISSING",
        "ai_recommend_events 테이블이 없습니다. 서버를 재시작해 자동 생성을 실행하세요."
      );
    }
    console.error("AI 추천 이벤트 기록 오류:", err);
    return fail(res, 500, "AI_RECOMMEND_EVENT_ERROR", "AI 추천 이벤트 기록에 실패했습니다.");
  }
});

app.post("/api/coupons/validate", async (req, res) => {
  const { code, subtotal } = req.body || {};
  const subtotalNum = Number(subtotal);
  if (isNaN(subtotalNum) || subtotalNum < 0) {
    return res.status(400).json({ valid: false, message: "주문 금액이 올바르지 않습니다." });
  }
  const result = await validateCoupon(db, code, subtotalNum); // lib/coupon.js에서 MySQL로 쿠폰 조회
  if (!result.valid) {
    return res.status(200).json({ valid: false, message: result.message });
  }
  res.json({ // Vue(체크아웃)로 검증 결과·할인액 전달
    valid: true,
    message: "쿠폰이 적용되었습니다.",
    discount: result.discount,
    finalTotal: result.finalTotal,
    coupon: result.coupon,
  });
});

app.get("/api/wishlist/check", (req, res) => {
  res.json({ ok: true, message: "wishlist API loaded" });
});
app.get("/api/wishlist/ids", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      "SELECT product_id FROM wishlists WHERE user_id = ?",
      [userId]
    );
    res.json(rows.map((r) => r.product_id));
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") return res.json([]);
    console.error("❌ 찜 ID 목록 조회 오류:", err);
    res.status(500).json({ error: "찜 ID 목록 조회 실패", message: err.message });
  }
});
app.get("/api/wishlist", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      `SELECT w.id, w.product_id, w.created_at,
              p.name, p.description, p.price, p.image_url, p.category
       FROM wishlists w
       LEFT JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );
    const list = rows.filter((r) => r.name != null).map((r) => ({
      id: r.id,
      product_id: r.product_id,
      created_at: r.created_at,
      name: r.name,
      description: r.description,
      price: r.price,
      image_url: r.image_url,
      category: r.category,
    }));
    res.json(list);
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") return res.json([]);
    console.error("❌ 찜 목록 조회 오류:", err);
    res.status(500).json({ error: "찜 목록 조회 실패", message: err.message });
  }
});
app.post("/api/wishlist/:productId", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const productId = Number(req.params.productId);
  if (!productId) {
    return res.status(400).json({ success: false, message: "상품 ID가 필요합니다." });
  }
  try {
    await db.query(
      "INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)",
      [userId, productId]
    );
    res.json({ success: true, message: "찜 목록에 추가되었습니다." });
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "찜 기능을 사용하려면 DB 마이그레이션(wishlist.sql)을 실행해 주세요." });
    }
    console.error("❌ 찜 추가 오류:", err);
    res.status(500).json({ success: false, message: "찜 추가 실패" });
  }
});
app.delete("/api/wishlist/:productId", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const productId = Number(req.params.productId);
  if (!productId) {
    return res.status(400).json({ success: false, message: "상품 ID가 필요합니다." });
  }
  try {
    await db.query("DELETE FROM wishlists WHERE user_id = ? AND product_id = ?", [
      userId,
      productId,
    ]);
    res.json({ success: true, message: "찜 목록에서 제거되었습니다." });
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") return res.json({ success: true });
    console.error("❌ 찜 제거 오류:", err);
    res.status(500).json({ success: false, message: "찜 제거 실패" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const key = cacheKey("categories", {});
    const cached = getCache(key);
    if (cached) {
      return res.json(cached);
    }
    const [rows] = await db.query(
      "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND TRIM(category) != '' ORDER BY category ASC"
    );
    const categories = rows.map((r) => r.category);
    setCache(key, categories);
    res.json(categories);
  } catch (err) {
    console.error("❌ 카테고리 조회 오류:", err);
    res.status(500).json({ error: "카테고리 조회 실패", message: err.message });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const key = cacheKey("products", req.query || {});
    const cached = getCache(key);
    if (cached) {
      return res.json(cached);
    }

    const result = await queryProductList(req.query);

    if (req.query.withMeta !== "1") {
      setCache(key, result.items);
      return res.json(result.items);
    }

    const payload = {
      items: result.items,
      pagination: result.pagination,
      engine: result.engine,
    };
    setCache(key, { success: true, message: "상품 목록 조회 성공", ...payload });
    return ok(res, payload, "상품 목록 조회 성공");
  } catch (err) {
    console.error("❌ 상품 조회 오류:", err);
    return fail(res, 500, "PRODUCT_LIST_ERROR", "상품 조회 실패");
  }
});

app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query("SELECT * FROM products WHERE id = ?", [id]); // MySQL에서 상품 1건 조회
    if (results.length === 0) {
      return res.status(404).json({ error: "상품을 찾을 수 없습니다." });
    }
    const product = results[0];
    try {
      const [imgRows] = await db.query(
        "SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC",
        [id]
      );
      product.images = imgRows.length > 0 ? imgRows.map((r) => r.image_url) : [product.image_url];
    } catch (_) {
      product.images = [product.image_url];
    }
    res.json(product); // 조회한 상품 데이터를 Vue로 전달
  } catch (err) {
    console.error("❌ 상품 상세 조회 오류:", err);
    res.status(500).json({ error: "상품 조회 실패", message: err.message });
  }
});

app.post("/api/products/:id/restock-subscriptions", async (req, res) => {
  const productId = Number(req.params.id);
  const email = normalizeEmail(req.body?.email);

  if (!productId) {
    return fail(res, 400, "INVALID_PRODUCT_ID", "잘못된 상품 ID입니다.");
  }
  if (!email || !isValidEmail(email)) {
    return fail(res, 400, "INVALID_EMAIL", "올바른 이메일 형식이 아닙니다.");
  }

  try {
    const [products] = await db.query("SELECT id, stock FROM products WHERE id = ?", [productId]);
    const product = products?.[0];
    if (!product) {
      return fail(res, 404, "PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다.");
    }
    if (Number(product.stock || 0) > 0) {
      return fail(res, 400, "ALREADY_IN_STOCK", "이미 구매 가능한 상품입니다.");
    }

    await db.query(
      `INSERT INTO restock_subscriptions (product_id, email, created_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         notified_at = NULL,
         created_at = NOW()`,
      [productId, email]
    );
    return ok(res, {}, "재입고 알림이 신청되었습니다.");
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return fail(
        res,
        503,
        "SCHEMA_MISSING",
        "restock_subscriptions 테이블이 없습니다. backend/database/restock_subscriptions.sql 을 실행하세요."
      );
    }
    console.error("❌ 재입고 알림 신청 오류:", err);
    return fail(res, 500, "RESTOCK_SUBSCRIBE_ERROR", "재입고 알림 신청에 실패했습니다.");
  }
});

app.post("/api/products/add", authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, price, image_url, category, stock, color_options, laptop_specs } = req.body;

  if (!name || price == null) {
    return res.status(400).json({ success: false, message: "상품명과 가격은 필수입니다." });
  }

  const colorStr =
    color_options == null || color_options === ""
      ? null
      : typeof color_options === "string"
        ? color_options
        : JSON.stringify(color_options);
  const specsStr =
    laptop_specs == null || laptop_specs === ""
      ? null
      : typeof laptop_specs === "string"
        ? laptop_specs
        : JSON.stringify(laptop_specs);

  try {
    const [result] = await db.query(
      "INSERT INTO products (name, description, price, image_url, category, stock, color_options, laptop_specs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        description || "",
        Number(price),
        image_url || "",
        category || null,
        stock != null && stock !== "" ? Number(stock) : 0,
        colorStr,
        specsStr,
      ]
    );
    clearProductCache();
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [result.insertId]);
    if (rows[0]) {
      syncProductToElasticsearch(rows[0]).catch((err) => {
        console.warn("ES 상품 동기화 실패:", err.message);
      });
    }
    res.json({ success: true, message: "상품이 등록되었습니다." });
  } catch (err) {
    console.error("❌ 상품 등록 오류:", err);
    res.status(500).json({ success: false, message: "상품 등록 실패" });
  }
});

app.put("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, price, image_url, category, stock, color_options, laptop_specs } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: "상품 ID가 필요합니다." });
  }
  try {
    const [beforeRows] = await db.query("SELECT id, name, stock FROM products WHERE id = ?", [id]);
    const beforeProduct = beforeRows?.[0];
    if (!beforeProduct) {
      return res.status(404).json({ success: false, message: "상품을 찾을 수 없습니다." });
    }
    const previousStock = Number(beforeProduct.stock || 0);

    const colorStr =
      color_options === undefined
        ? undefined
        : color_options == null || color_options === ""
          ? null
          : typeof color_options === "string"
            ? color_options
            : JSON.stringify(color_options);
    const specsStr =
      laptop_specs === undefined
        ? undefined
        : laptop_specs == null || laptop_specs === ""
          ? null
          : typeof laptop_specs === "string"
            ? laptop_specs
            : JSON.stringify(laptop_specs);

    const setParts = [
      "name = COALESCE(?, name)",
      "description = COALESCE(?, description)",
      "price = COALESCE(?, price)",
      "image_url = COALESCE(?, image_url)",
      "category = ?",
      "stock = COALESCE(?, stock)",
    ];
    const params = [
      name,
      description,
      price != null ? Number(price) : null,
      image_url,
      category || null,
      stock != null ? Number(stock) : null,
    ];
    if (Object.prototype.hasOwnProperty.call(req.body, "color_options")) {
      setParts.push("color_options = ?");
      params.push(colorStr);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "laptop_specs")) {
      setParts.push("laptop_specs = ?");
      params.push(specsStr);
    }
    params.push(id);
    const [result] = await db.query(`UPDATE products SET ${setParts.join(", ")} WHERE id = ?`, params);
    const nextStock = stock != null ? Number(stock) : previousStock;
    if (previousStock <= 0 && nextStock > 0) {
      await notifyRestockSubscribers({
        id,
        name: name || beforeProduct.name || "상품",
      });
    }
    clearProductCache();
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    if (rows[0]) {
      syncProductToElasticsearch(rows[0]).catch((err) => {
        console.warn("ES 상품 동기화 실패:", err.message);
      });
    }
    res.json({ success: true, message: "상품이 수정되었습니다." });
  } catch (err) {
    console.error("❌ 상품 수정 오류:", err);
    res.status(500).json({ success: false, message: "상품 수정 실패" });
  }
});

app.get("/api/products/:id/reviews", async (req, res) => {
  const productId = Number(req.params.id);
  if (!productId) {
    return res.status(400).json({ error: "상품 ID가 필요합니다." });
  }
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.content, r.created_at, u.name AS user_name
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [productId]
    );
    res.json(rows);
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.json([]);
    }
    console.error("❌ 리뷰 조회 오류:", err);
    res.status(500).json({ error: "리뷰 조회 실패" });
  }
});

app.post("/api/products/:id/reviews", authenticateToken, async (req, res) => {
  const productId = Number(req.params.id);
  const userId = req.user.id;
  const { rating, content } = req.body;
  if (!productId || rating == null || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "별점(1~5)은 필수입니다." });
  }
  try {
    await db.query(
      "INSERT INTO reviews (product_id, user_id, rating, content) VALUES (?, ?, ?, ?)",
      [productId, userId, Number(rating), (content || "").trim()]
    );
    res.json({ success: true, message: "리뷰가 등록되었습니다." });
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "리뷰 테이블이 없습니다. DB 마이그레이션을 실행해 주세요." });
    }
    console.error("❌ 리뷰 등록 오류:", err);
    res.status(500).json({ success: false, message: "리뷰 등록 실패" });
  }
});

app.delete("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ success: false, message: "상품 ID가 필요합니다." });
  }
  try {
    const [result] = await db.query("DELETE FROM products WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "상품을 찾을 수 없습니다." });
    }
    clearProductCache();
    removeProductFromElasticsearch(id).catch((err) => {
      console.warn("ES 상품 삭제 실패:", err.message);
    });
    res.json({ success: true, message: "상품이 삭제되었습니다." });
  } catch (err) {
    console.error("❌ 상품 삭제 오류:", err);
    res.status(500).json({ success: false, message: "상품 삭제 실패" });
  }
});

app.post("/api/orders", authenticateToken, async (req, res) => {
  console.log("📦 주문 요청 데이터:", JSON.stringify(req.body, null, 2));

  const { items, total_price, recipient_name, address, phone, imp_uid, merchant_uid, coupon_code } = req.body;
  const userId = req.user?.id;

  const recipient = recipient_name || "이름없음";
  const addr = address || "주소없음";
  const tel = phone || "연락처없음";

  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "잘못된 주문 데이터입니다." });
  }
  if (!recipient_name || !address || !phone) {
    return fail(res, 400, "INVALID_SHIPPING_INFO", "배송 정보(이름/주소/연락처)는 필수입니다.");
  }
  if (!items.every((it) => Number(it.id) > 0 && Number(it.price) >= 0 && Number(it.quantity || 1) > 0)) {
    return fail(res, 400, "INVALID_ORDER_ITEMS", "주문 상품 데이터가 올바르지 않습니다.");
  }

  const subtotal = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  let discountedSubtotal = subtotal;
  let couponId = null;
  let discountAmount = 0;

  if (coupon_code && String(coupon_code).trim()) {
    const couponResult = await validateCoupon(db, coupon_code, subtotal);
    if (!couponResult.valid) {
      return res.status(400).json({ success: false, message: couponResult.message || "쿠폰 적용에 실패했습니다." });
    }
    discountedSubtotal = couponResult.finalTotal;
    discountAmount = couponResult.discount;
    couponId = couponResult.coupon?.id ?? null;
  }

  const shippingFee = calcShippingFee(discountedSubtotal);
  const finalTotal = discountedSubtotal + shippingFee;

  if (total_price == null || isNaN(Number(total_price))) {
    return res.status(400).json({
      success: false,
      message: "❌ Invalid or missing total_price value",
    });
  }

  const requestedTotal = Number(total_price);
  if (Math.abs(requestedTotal - finalTotal) > 1) {
    return res.status(400).json({
      success: false,
      message: "결제 금액이 일치하지 않습니다. 쿠폰/배송비 적용 상태를 확인한 뒤 다시 시도해주세요.",
    });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const itemProductIds = [...new Set(items.map((it) => Number(it.id)).filter((v) => Number.isFinite(v) && v > 0))];
    if (!itemProductIds.length) {
      return fail(res, 400, "INVALID_ORDER_ITEMS", "주문 상품 데이터가 올바르지 않습니다.");
    }

    const lockSql = `
      SELECT id, name, stock
      FROM products
      WHERE id IN (${itemProductIds.map(() => "?").join(",")})
      FOR UPDATE
    `;
    const [stockRows] = await conn.query(lockSql, itemProductIds);
    const stockMap = new Map(stockRows.map((r) => [Number(r.id), Number(r.stock || 0)]));

    for (const it of items) {
      const productId = Number(it.id);
      const qty = Number(it.quantity || 1);
      const currentStock = stockMap.get(productId);
      if (currentStock == null) {
        return fail(res, 400, "PRODUCT_NOT_FOUND", `상품(ID:${productId})을 찾을 수 없습니다.`);
      }
      if (qty > currentStock) {
        return fail(res, 400, "INSUFFICIENT_STOCK", "재고가 부족한 상품이 있습니다. 장바구니를 확인해 주세요.");
      }
    }

    if (imp_uid) {
      console.log(`✅ 결제 검증: imp_uid=${imp_uid}, merchant_uid=${merchant_uid}`);
    }

    let orderColumns = "user_id, recipient_name, address, phone, total_price, status, created_at";
    let orderValues = "?, ?, ?, ?, ?, ?, NOW()";
    let orderParams = [userId, recipient, addr, tel, finalTotal, "paid"];

    if (couponId != null || discountAmount > 0) {
      try {
        await conn.query("SELECT coupon_id, discount_amount FROM orders LIMIT 1");
        orderColumns += ", coupon_id, discount_amount";
        orderValues += ", ?, ?";
        orderParams.push(couponId, discountAmount);
      } catch (colError) {
        console.warn("⚠️ orders에 coupon_id/discount_amount 컬럼이 없습니다. coupons.sql 실행 후 사용하세요.");
      }
    }

    if (imp_uid || merchant_uid) {
      try {
        await conn.query("SELECT imp_uid, merchant_uid FROM orders LIMIT 1");
        orderColumns += ", imp_uid, merchant_uid";
        orderValues += ", ?, ?";
        orderParams.push(imp_uid || null, merchant_uid || null);
      } catch (colError) {
        console.warn("⚠️ imp_uid, merchant_uid 컬럼이 없습니다. 기본 컬럼만 사용합니다.");
      }
    }

    const [orderResult] = await conn.query(
      `INSERT INTO orders (${orderColumns}) VALUES (${orderValues})`,
      orderParams
    );

    const orderId = orderResult.insertId;
    if (couponId != null) {
      await conn.query("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?", [couponId]);
    }

    console.log(`🆕 신규 주문 생성 완료 (order_id=${orderId})`);

    const placeholders = items.map(() => "(?, ?, ?, ?)").join(", ");
    const flatValues = items.flatMap((item) => [
      orderId,
      item.id,
      item.quantity || 1,
      Number(item.price),
    ]);

    await conn.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price)
       VALUES ${placeholders}`,
      flatValues
    );

    for (const it of items) {
      const productId = Number(it.id);
      const qty = Number(it.quantity || 1);
      await conn.query(
        "UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?",
        [qty, productId]
      );
    }

    await conn.commit();
    console.log("✅ 주문 전체 처리 완료:", orderId);

    res.json({ success: true, orderId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ 주문 처리 중 오류 발생:", err);
    res.status(500).json({ success: false, message: "주문 생성 실패", error: err?.message || err });
  } finally {
    conn.release();
  }
});

app.get("/api/orders", authenticateToken, async (req, res) => {
  const { userId } = req.query;
  const requestUserId = userId || req.user?.id;

  if (!requestUserId) {
    return res.status(400).json({ success: false, message: "userId가 필요합니다." });
  }

  if (req.user && req.user.id !== Number(requestUserId)) {
    return res.status(403).json({ success: false, message: "권한이 없습니다." });
  }

  const listSqlWithTracking = `SELECT 
          o.id, o.recipient_name, o.address, o.total_price, o.status, o.created_at,
          o.carrier_code, o.tracking_number,
          GROUP_CONCAT(p.name SEPARATOR ', ') AS products
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = ?
       GROUP BY o.id, o.recipient_name, o.address, o.total_price, o.status, o.created_at, o.carrier_code, o.tracking_number
       ORDER BY o.created_at DESC`;
  const listSqlLegacy = `SELECT 
          o.id, o.recipient_name, o.address, o.total_price, o.status, o.created_at,
          GROUP_CONCAT(p.name SEPARATOR ', ') AS products
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = ?
       GROUP BY o.id, o.recipient_name, o.address, o.total_price, o.status, o.created_at
       ORDER BY o.created_at DESC`;

  try {
    let orders;
    try {
      [orders] = await db.query(listSqlWithTracking, [requestUserId]);
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        [orders] = await db.query(listSqlLegacy, [requestUserId]);
      } else {
        throw e;
      }
    }
    const enriched = orders.map((o) => ({
      ...o,
      carrier_label: o.carrier_code ? getCarrierLabel(o.carrier_code) : null,
      tracking_url: buildTrackingUrl(o.carrier_code, o.tracking_number),
    }));
    res.json({ success: true, orders: enriched });
  } catch (err) {
    console.error("❌ 주문 내역 조회 오류:", err);
    res.status(500).json({ success: false, message: "주문 내역 조회 실패" });
  }
});

app.get("/api/orders/detail/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [orderRows] = await db.query("SELECT * FROM orders WHERE id = ?", [id]);
    const order = orderRows?.[0];
    if (!order) {
      return res.status(404).json({ success: false, message: "주문을 찾을 수 없습니다." });
    }

    const isOwner = Number(order.user_id) === Number(req.user?.id);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return fail(res, 403, "FORBIDDEN", "주문 상세 조회 권한이 없습니다.");
    }

    const [items] = await db.query(
      `SELECT oi.*, p.name AS product_name, p.image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    const carrierCode = order.carrier_code || null;
    const trackingNo = order.tracking_number || null;
    const trackingUrl = buildTrackingUrl(carrierCode, trackingNo);

    res.json({
      success: true,
      order: {
        id: order.id,
        recipient_name: order.recipient_name,
        address: order.address,
        phone: order.phone,
        total_price: order.total_price,
        created_at: order.created_at,
        status: order.status,
        carrier_code: carrierCode,
        carrier_label: carrierCode ? getCarrierLabel(carrierCode) : null,
        tracking_number: trackingNo,
        tracking_url: trackingUrl,
      },
      items: items.map((i) => ({
        id: i.id,
        name: i.product_name,
        image_url: i.image_url,
        quantity: i.quantity,
        price: i.price,
      })),
    });
  } catch (err) {
    console.error("❌ 주문 상세 조회 실패:", err);
    res.status(500).json({ success: false, message: "주문 상세 조회 실패" });
  }
});

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "관리자 권한이 필요합니다." });
  }
  next();
}

app.get("/api/admin/orders", authenticateToken, requireAdmin, async (req, res) => {
  const sqlWithTracking = `
      SELECT 
        o.id,
        o.user_id,
        o.recipient_name,
        o.address,
        o.total_price,
        o.status,
        o.created_at,
        o.carrier_code,
        o.tracking_number,
        GROUP_CONCAT(p.name SEPARATOR ', ') AS products
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id, o.user_id, o.recipient_name, o.address, o.total_price, o.status, o.created_at, o.carrier_code, o.tracking_number
      ORDER BY o.created_at DESC`;
  const sqlLegacy = `
      SELECT 
        o.id,
        o.user_id,
        o.recipient_name,
        o.address,
        o.total_price,
        o.status,
        o.created_at,
        GROUP_CONCAT(p.name SEPARATOR ', ') AS products
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id, o.user_id, o.recipient_name, o.address, o.total_price, o.status, o.created_at
      ORDER BY o.created_at DESC`;

  try {
    let orders;
    try {
      [orders] = await db.query(sqlWithTracking);
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        [orders] = await db.query(sqlLegacy);
      } else {
        throw e;
      }
    }
    res.json(orders);
  } catch (err) {
    console.error("❌ 관리자 주문 조회 오류:", err);
    res.status(500).json({ success: false, message: "주문 조회 실패" });
  }
});

app.get("/api/admin/analytics/ai-recommend-stats", authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const stats = await getAiRecommendStatsForAdmin();
    return ok(res, stats, "ai recommend stats");
  } catch (err) {
    console.error("AI 추천 통계 조회 오류:", err);
    return fail(res, 500, "AI_RECOMMEND_STATS_ERROR", "AI 추천 통계를 불러오지 못했습니다.");
  }
});

app.get("/api/admin/crm/summary", authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const summary = await getCrmSummary(db);
    return ok(res, { summary, segmentLabels: CRM_SEGMENT_LABELS });
  } catch (err) {
    console.error("CRM 요약 조회 오류:", err);
    return fail(res, 500, "CRM_SUMMARY_ERROR", "CRM 요약을 불러오지 못했습니다.");
  }
});

app.get("/api/admin/users/export", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const csv = await exportAllCustomers(db, {
      search: req.query.search || req.query.q,
      segment: req.query.segment,
    });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="customers.csv"');
    return res.send(csv);
  } catch (err) {
    console.error("고객 CSV export 오류:", err);
    return fail(res, 500, "CRM_EXPORT_ERROR", "고객 데이터 내보내기에 실패했습니다.");
  }
});

app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await listCustomers(db, {
      search: req.query.search || req.query.q,
      segment: req.query.segment,
      page: req.query.page,
      limit: req.query.limit,
    });
    return ok(res, result);
  } catch (err) {
    console.error("관리자 고객 목록 조회 오류:", err);
    return fail(res, 500, "ADMIN_USERS_ERROR", "고객 목록을 불러오지 못했습니다.");
  }
});

app.get("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return fail(res, 400, "INVALID_USER_ID", "유효하지 않은 고객 ID입니다.");
  }

  try {
    const [users] = await db.query(
      `SELECT id, email, name, gender, role, created_at FROM users WHERE id = ?`,
      [userId]
    );
    if (!users.length) {
      return fail(res, 404, "USER_NOT_FOUND", "고객을 찾을 수 없습니다.");
    }

    const [orders] = await db.query(
      `SELECT
         o.id,
         o.total_price,
         o.status,
         o.recipient_name,
         o.created_at,
         GROUP_CONCAT(p.name SEPARATOR ', ') AS products
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.user_id = ?
       GROUP BY o.id, o.total_price, o.status, o.recipient_name, o.created_at
       ORDER BY o.created_at DESC
       LIMIT 20`,
      [userId]
    );

    const [statsRows] = await db.query(
      `SELECT
         COUNT(*) AS order_count,
         COALESCE(SUM(CASE WHEN status NOT IN ('cancelled') THEN total_price ELSE 0 END), 0) AS total_spent,
         MAX(created_at) AS last_order_at
       FROM orders
       WHERE user_id = ?`,
      [userId]
    );

    return ok(res, {
      user: users[0],
      stats: statsRows[0] || { order_count: 0, total_spent: 0, last_order_at: null },
      orders,
    });
  } catch (err) {
    console.error("관리자 고객 상세 조회 오류:", err);
    return fail(res, 500, "ADMIN_USER_DETAIL_ERROR", "고객 상세를 불러오지 못했습니다.");
  }
});

app.get("/api/admin/restock-subscriptions/counts", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT product_id, COUNT(*) AS pending_count
       FROM restock_subscriptions
       WHERE notified_at IS NULL
       GROUP BY product_id`
    );
    return ok(res, { counts: rows });
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return fail(
        res,
        503,
        "SCHEMA_MISSING",
        "restock_subscriptions 테이블이 없습니다. backend/database/restock_subscriptions.sql 을 실행하세요."
      );
    }
    console.error("❌ 재입고 알림 신청자 수 조회 오류:", err);
    return fail(res, 500, "RESTOCK_COUNT_ERROR", "재입고 신청자 수를 불러오지 못했습니다.");
  }
});

app.put("/api/admin/orders/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatus = new Set(["paid", "preparing", "shipping", "done", "cancelled"]);

  if (!status || !allowedStatus.has(String(status))) {
    return fail(res, 400, "INVALID_STATUS", "유효하지 않은 주문 상태입니다.");
  }

  try {
    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true, message: "주문 상태가 변경되었습니다." });
  } catch (err) {
    console.error("❌ 주문 상태 변경 오류:", err);
    res.status(500).json({ success: false, message: "상태 변경 실패" });
  }
});

app.put("/api/admin/orders/:id/tracking", authenticateToken, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { carrier_code, tracking_number } = req.body || {};
  if (!id) {
    return fail(res, 400, "INVALID_ID", "주문 ID가 필요합니다.");
  }

  const no = String(tracking_number ?? "").trim();
  const code = String(carrier_code ?? "").trim();

  try {
    if (!no) {
      await db.query("UPDATE orders SET carrier_code = NULL, tracking_number = NULL WHERE id = ?", [id]);
      return ok(res, {}, "배송 추적 정보가 삭제되었습니다.");
    }
    if (!isValidCarrierCode(code)) {
      return fail(res, 400, "INVALID_CARRIER", "지원하지 않는 택배사입니다. /api/shipping/carriers 목록을 확인하세요.");
    }
    await db.query("UPDATE orders SET carrier_code = ?, tracking_number = ? WHERE id = ?", [code, no, id]);
    const url = buildTrackingUrl(code, no);
    return ok(res, { tracking_url: url }, "송장이 등록되었습니다.");
  } catch (err) {
    if (err.code === "ER_BAD_FIELD_ERROR") {
      return fail(
        res,
        503,
        "SCHEMA_MISSING",
        "orders 테이블에 carrier_code, tracking_number 컬럼이 없습니다. backend/database/order_tracking.sql 을 실행하세요."
      );
    }
    console.error("❌ 송장 등록 오류:", err);
    return fail(res, 500, "TRACKING_UPDATE_ERROR", "송장 정보 저장에 실패했습니다.");
  }
});

app.get("/api/admin/notices", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, title, body, is_active, priority, starts_at, ends_at, created_at, updated_at
       FROM notices ORDER BY id DESC`
    );
    return ok(res, { notices: rows });
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return fail(
        res,
        503,
        "SCHEMA_MISSING",
        "notices 테이블이 없습니다. backend/database/notices.sql 을 실행하세요."
      );
    }
    console.error("관리자 공지 목록 오류:", err);
    return fail(res, 500, "ADMIN_NOTICES_ERROR", "공지 목록을 불러오지 못했습니다.");
  }
});

app.post("/api/admin/notices", authenticateToken, requireAdmin, async (req, res) => {
  const title = String(req.body?.title || "").trim();
  const bodyText = String(req.body?.body || "").trim();
  if (!title || !bodyText) {
    return fail(res, 400, "INVALID_INPUT", "제목과 내용은 필수입니다.");
  }
  const is_active = req.body?.is_active === false || req.body?.is_active === 0 ? 0 : 1;
  const priority = Number(req.body?.priority);
  const pr = Number.isFinite(priority) ? Math.round(priority) : 0;
  const starts_at = parseOptionalMysqlDatetime(req.body?.starts_at);
  const ends_at = parseOptionalMysqlDatetime(req.body?.ends_at);

  try {
    const [result] = await db.query(
      `INSERT INTO notices (title, body, is_active, priority, starts_at, ends_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, bodyText, is_active, pr, starts_at, ends_at]
    );
    return ok(res, { id: result.insertId }, "공지가 등록되었습니다.");
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return fail(
        res,
        503,
        "SCHEMA_MISSING",
        "notices 테이블이 없습니다. backend/database/notices.sql 을 실행하세요."
      );
    }
    console.error("공지 등록 오류:", err);
    return fail(res, 500, "NOTICE_CREATE_ERROR", "공지 등록에 실패했습니다.");
  }
});

app.put("/api/admin/notices/:id", authenticateToken, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return fail(res, 400, "INVALID_ID", "잘못된 공지 ID입니다.");
  const title = String(req.body?.title || "").trim();
  const bodyText = String(req.body?.body || "").trim();
  if (!title || !bodyText) {
    return fail(res, 400, "INVALID_INPUT", "제목과 내용은 필수입니다.");
  }
  const is_active = req.body?.is_active === false || req.body?.is_active === 0 ? 0 : 1;
  const priority = Number(req.body?.priority);
  const pr = Number.isFinite(priority) ? Math.round(priority) : 0;
  const starts_at = parseOptionalMysqlDatetime(req.body?.starts_at);
  const ends_at = parseOptionalMysqlDatetime(req.body?.ends_at);

  try {
    const [r] = await db.query(
      `UPDATE notices SET title = ?, body = ?, is_active = ?, priority = ?, starts_at = ?, ends_at = ?
       WHERE id = ?`,
      [title, bodyText, is_active, pr, starts_at, ends_at, id]
    );
    if (!r.affectedRows) return fail(res, 404, "NOT_FOUND", "공지를 찾을 수 없습니다.");
    return ok(res, {}, "공지가 수정되었습니다.");
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return fail(
        res,
        503,
        "SCHEMA_MISSING",
        "notices 테이블이 없습니다. backend/database/notices.sql 을 실행하세요."
      );
    }
    console.error("공지 수정 오류:", err);
    return fail(res, 500, "NOTICE_UPDATE_ERROR", "공지 수정에 실패했습니다.");
  }
});

app.delete("/api/admin/notices/:id", authenticateToken, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return fail(res, 400, "INVALID_ID", "잘못된 공지 ID입니다.");
  try {
    const [r] = await db.query("DELETE FROM notices WHERE id = ?", [id]);
    if (!r.affectedRows) return fail(res, 404, "NOT_FOUND", "공지를 찾을 수 없습니다.");
    return ok(res, {}, "공지가 삭제되었습니다.");
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return fail(
        res,
        503,
        "SCHEMA_MISSING",
        "notices 테이블이 없습니다. backend/database/notices.sql 을 실행하세요."
      );
    }
    console.error("공지 삭제 오류:", err);
    return fail(res, 500, "NOTICE_DELETE_ERROR", "공지 삭제에 실패했습니다.");
  }
});

app.post("/api/auth/signup", async (req, res) => {
  const { password, name, gender } = req.body;
  const email = normalizeEmail(req.body?.email);

  if (!email || !password || !name) {
    return fail(res, 400, "INVALID_INPUT", "이메일, 비밀번호, 이름은 필수입니다.");
  }
  if (!isValidEmail(email)) {
    return fail(res, 400, "INVALID_EMAIL", "올바른 이메일 형식이 아닙니다.");
  }
  if (String(password).length < 8) {
    return fail(res, 400, "WEAK_PASSWORD", "비밀번호는 8자 이상이어야 합니다.");
  }

  try {
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return fail(res, 400, "EMAIL_EXISTS", "이미 등록된 이메일입니다.");
    }

    const hashedPassword = await hashPassword(password);

    const [result] = await db.query(
      "INSERT INTO users (email, password, name, gender, created_at) VALUES (?, ?, ?, ?, NOW())",
      [email, hashedPassword, name, gender || null]
    );

    const token = generateToken({
      id: result.insertId,
      email: email,
      name: name,
    });

    res.status(201).json({
      success: true,
      message: "회원가입이 완료되었습니다.",
      token: token,
      user: {
        id: result.insertId,
        email: email,
        name: name,
        gender: gender || null,
      },
    });
  } catch (err) {
    console.error("❌ 회원가입 오류:", err);
    return fail(res, 500, "SIGNUP_ERROR", "회원가입 중 오류가 발생했습니다.");
  }
});

const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || "admin2025";
app.post("/api/auth/signup-admin", async (req, res) => {
  const { password, name, inviteCode } = req.body;
  const email = normalizeEmail(req.body?.email);

  if (!email || !password || !name) {
    return fail(res, 400, "INVALID_INPUT", "이메일, 비밀번호, 이름은 필수입니다.");
  }
  if (!isValidEmail(email)) {
    return fail(res, 400, "INVALID_EMAIL", "올바른 이메일 형식이 아닙니다.");
  }
  if (String(password).length < 8) {
    return fail(res, 400, "WEAK_PASSWORD", "비밀번호는 8자 이상이어야 합니다.");
  }
  if (!inviteCode || inviteCode !== ADMIN_INVITE_CODE) {
    return fail(res, 403, "INVALID_INVITE_CODE", "관리자 초대 코드가 올바르지 않습니다.");
  }

  try {
    const [existingUsers] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
      return fail(res, 400, "EMAIL_EXISTS", "이미 등록된 이메일입니다.");
    }

    const hashedPassword = await hashPassword(password);
    const [result] = await db.query(
      "INSERT INTO users (email, password, name, gender, role, created_at) VALUES (?, ?, ?, NULL, 'admin', NOW())",
      [email, hashedPassword, name]
    );

    const token = generateToken({
      id: result.insertId,
      email,
      name,
      role: "admin",
    });

    res.status(201).json({
      success: true,
      message: "관리자 계정이 생성되었습니다.",
      token,
      user: {
        id: result.insertId,
        email,
        name,
        role: "admin",
      },
    });
  } catch (err) {
    console.error("❌ 관리자 회원가입 오류:", err);
    return fail(res, 500, "ADMIN_SIGNUP_ERROR", "회원가입 중 오류가 발생했습니다.");
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { password, captchaToken } = req.body || {};
  const email = normalizeEmail(req.body?.email);
  const attemptKey = buildLoginAttemptKey(email, req.ip);

  if (!email || !password) {
    return fail(res, 400, "INVALID_INPUT", "이메일과 비밀번호를 입력해주세요.");
  }
  if (loginAttempts.isLocked(attemptKey)) {
    const retryAfterMs = loginAttempts.remainingLockMs(attemptKey);
    return fail(res, 429, "TOO_MANY_ATTEMPTS", "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.", {
      retryAfterMs,
      requiresCaptcha: true,
    });
  }
  if (loginAttempts.shouldRequireCaptcha(attemptKey)) {
    const captchaResult = await verifyCaptchaToken(captchaToken, req.ip);
    if (!captchaResult.success) {
      return fail(res, 400, "CAPTCHA_REQUIRED", "보안 인증 확인 후 다시 시도해주세요.", {
        requiresCaptcha: true,
        captchaProvider: captchaResult.provider,
      });
    }
  }

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [ // MySQL에서 유저 조회
      email,
    ]);

    if (users.length === 0) {
      const state = loginAttempts.registerFailure(attemptKey);
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
        requiresCaptcha: loginAttempts.shouldRequireCaptcha(attemptKey) || state.count >= 3,
      });
    }

    const user = users[0];

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      const state = loginAttempts.registerFailure(attemptKey);
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
        requiresCaptcha: loginAttempts.shouldRequireCaptcha(attemptKey) || state.count >= 3,
      });
    }
    loginAttempts.clear(attemptKey);

    const role = user.role || "user";

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role,
    });

    res.json({ // Vue에 토큰·유저 정보 전달
      success: true,
      message: "로그인 성공",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        gender: user.gender,
        role,
      },
    });
  } catch (err) {
    console.error("❌ 로그인 오류:", err);
    return fail(res, 500, "LOGIN_ERROR", "로그인 중 오류가 발생했습니다.");
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email || !isValidEmail(email)) {
    return fail(res, 400, "INVALID_EMAIL", "올바른 이메일 형식이 아닙니다.");
  }

  try {
    const [users] = await db.query("SELECT id, email FROM users WHERE email = ?", [email]);
    if (users.length > 0) {
      const user = users[0];
      const rawToken = makeResetToken();
      saveResetToken(user.id, rawToken);
      const clientBaseUrl = (process.env.CLIENT_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
      const resetUrl = `${clientBaseUrl}/reset-password?token=${rawToken}`;
      const mailResult = await sendPasswordResetEmail({
        toEmail: user.email,
        resetUrl,
      });
      if (!mailResult.sent) {
        console.log(`🔐 비밀번호 재설정 링크 (${user.email}): ${resetUrl}`);
      }
    }

    return res.json({
      success: true,
      message: "입력한 이메일로 비밀번호 재설정 안내를 전송했습니다.",
    });
  } catch (err) {
    console.error("❌ 비밀번호 재설정 요청 오류:", err);
    return fail(res, 500, "FORGOT_PASSWORD_ERROR", "비밀번호 재설정 요청 처리 중 오류가 발생했습니다.");
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) {
    return fail(res, 400, "INVALID_INPUT", "토큰과 새 비밀번호를 입력해주세요.");
  }
  if (String(newPassword).length < 8) {
    return fail(res, 400, "WEAK_PASSWORD", "비밀번호는 8자 이상이어야 합니다.");
  }

  const tokenData = consumeResetToken(token);
  if (!tokenData) {
    return fail(res, 400, "INVALID_TOKEN", "비밀번호 재설정 토큰이 유효하지 않거나 만료되었습니다.");
  }

  try {
    const hashedPassword = await hashPassword(newPassword);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, tokenData.userId]);
    return res.json({
      success: true,
      message: "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.",
    });
  } catch (err) {
    console.error("❌ 비밀번호 재설정 오류:", err);
    return fail(res, 500, "RESET_PASSWORD_ERROR", "비밀번호 재설정 중 오류가 발생했습니다.");
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query("SELECT id, email, name, gender, created_at FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    const u = users[0];
    if (req.user.role) u.role = req.user.role;
    else u.role = "user";

    res.json({
      success: true,
      user: u,
    });
  } catch (err) {
    console.error("❌ 사용자 정보 조회 오류:", err);
    res.status(500).json({
      success: false,
      message: "사용자 정보 조회 중 오류가 발생했습니다.",
    });
  }
});

app.put("/api/auth/me", authenticateToken, async (req, res) => {
  const { name, gender } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "이름은 필수입니다.",
    });
  }

  try {
    await db.query(
      "UPDATE users SET name = ?, gender = ? WHERE id = ?",
      [name.trim(), gender || null, req.user.id]
    );

    res.json({
      success: true,
      message: "정보가 수정되었습니다.",
    });
  } catch (err) {
    console.error("❌ 사용자 정보 수정 오류:", err);
    res.status(500).json({
      success: false,
      message: "정보 수정 중 오류가 발생했습니다.",
    });
  }
});

app.use((err, req, res, next) => {
  console.error("❌ 처리되지 않은 서버 오류:", err);
  if (res.headersSent) return next(err);
  return fail(res, 500, "INTERNAL_SERVER_ERROR", "서버 내부 오류가 발생했습니다.");
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log("✅ 찜 API: GET/POST/DELETE /api/wishlist, GET /api/wishlist/ids");
});
