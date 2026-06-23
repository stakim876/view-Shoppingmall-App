#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const backendEnvPath = path.join(root, "backend", ".env");
const clientEnvPath = path.join(root, "client", ".env");

const PORTONE_GUIDE = `
=== PortOne 실제 결제 테스트 설정 ===

1. https://admin.portone.io 가입/로그인
2. [결제 연동] → [연동 관리] → 테스트 모드 ON
3. PG 채널 추가 (예: 이니시스 html5_inicis 테스트 채널)
4. [식별코드 · API Keys] → V1 API 탭에서 확인:
   - 고객사 식별코드  → client/.env 의 VITE_PORTONE_STORE_ID
   - REST API Key     → backend/.env 의 PORTONE_API_KEY
   - REST API Secret  → backend/.env 의 PORTONE_API_SECRET

5. client/.env 예시:
   VITE_PORTONE_STORE_ID=imp12345678
   VITE_DEV_MOCK_PAYMENT=false

6. backend/.env 예시:
   PORTONE_API_KEY=your_rest_api_key
   PORTONE_API_SECRET=your_rest_api_secret

테스트 카드: 1234-5678-9012-3456 / 12/34 / CVC 123
`;

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const map = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    map[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return map;
}

function upsertEnv(filePath, updates) {
  let lines = [];
  if (fs.existsSync(filePath)) {
    lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  }
  const keys = new Set(Object.keys(updates));
  const out = [];
  const written = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      out.push(line);
      continue;
    }
    const idx = trimmed.indexOf("=");
    if (idx === -1) {
      out.push(line);
      continue;
    }
    const key = trimmed.slice(0, idx).trim();
    if (keys.has(key)) {
      out.push(`${key}=${updates[key]}`);
      written.add(key);
    } else {
      out.push(line);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!written.has(key)) out.push(`${key}=${value}`);
  }

  fs.writeFileSync(filePath, `${out.join("\n").replace(/\n*$/, "")}\n`, "utf8");
}

function isPlaceholderStoreId(value) {
  const v = String(value || "");
  return !v || /^impX+$/i.test(v) || /xxxx|placeholder/i.test(v);
}

function isPlaceholderSmtp(user) {
  return /your-|example\.com|placeholder/i.test(String(user || ""));
}

const backendEnv = readEnv(backendEnvPath);
const clientEnv = readEnv(clientEnvPath);

const backendUpdates = {
  SMTP_DEV_ETHEREAL: "true",
  ADMIN_BOOTSTRAP_EMAIL: backendEnv.ADMIN_BOOTSTRAP_EMAIL || "admin@myshop.com",
  ADMIN_BOOTSTRAP_PASSWORD: backendEnv.ADMIN_BOOTSTRAP_PASSWORD || "MyShopAdmin1",
};
if (!backendEnv.PORTONE_API_KEY) backendUpdates.PORTONE_API_KEY = "";
if (!backendEnv.PORTONE_API_SECRET) backendUpdates.PORTONE_API_SECRET = "";

const clientUpdates = {};
if (isPlaceholderStoreId(clientEnv.VITE_PORTONE_STORE_ID)) {
  clientUpdates.VITE_DEV_MOCK_PAYMENT = "true";
}

upsertEnv(backendEnvPath, backendUpdates);
upsertEnv(clientEnvPath, clientUpdates);

const fix = spawnSync(process.execPath, ["scripts/fix-demo-admin.mjs"], {
  cwd: path.join(root, "backend"),
  stdio: "inherit",
});
if (fix.status !== 0) {
  console.warn("⚠️ fix:admin 실패 — DB 연결·.env 를 확인한 뒤 backend 에서 npm run fix:admin 을 실행하세요.");
}

console.log("✅ 로컬 개발 설정 반영 완료\n");
console.log("- backend/.env: ADMIN_BOOTSTRAP_EMAIL/PASSWORD (로컬 데모 관리자)");
console.log("- backend/.env: SMTP_DEV_ETHEREAL=true (Gmail 미설정 시 Ethereal 테스트 메일)");
console.log("- client/.env: VITE_DEV_MOCK_PAYMENT=true (PortOne ID 없을 때 테스트 주문)\n");

console.log("현재 상태:");
console.log(`  DB: ${backendEnv.DB_HOST || "(미설정)"} / ${backendEnv.DB_NAME || "(미설정)"}`);
console.log(`  OpenAI: ${backendEnv.OPENAI_API_KEY ? "설정됨" : "미설정 (규칙 기반 fallback)"}`);
console.log(
  `  결제: ${
    isPlaceholderStoreId(clientEnv.VITE_PORTONE_STORE_ID)
      ? "개발용 테스트 주문 모드"
      : `PortOne ${clientEnv.VITE_PORTONE_STORE_ID}`
  }`
);
console.log(
  `  메일: ${
    isPlaceholderSmtp(backendEnv.SMTP_USER)
      ? "Ethereal 자동 (비밀번호 찾기 시 미리보기 링크)"
      : `SMTP ${backendEnv.SMTP_USER}`
  }`
);

if (isPlaceholderStoreId(clientEnv.VITE_PORTONE_STORE_ID) || !backendEnv.PORTONE_API_KEY) {
  console.log(PORTONE_GUIDE);
}

console.log("다음 단계: npm run dev 로 서버 재시작 후 체크아웃·비밀번호 찾기를 테스트하세요.");
