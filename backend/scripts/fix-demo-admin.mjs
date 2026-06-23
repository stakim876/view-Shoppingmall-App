#!/usr/bin/env node
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { ensureDemoAdmin } from "../lib/demoAdmin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
});

const result = await ensureDemoAdmin(db);
await db.end();

if (!result.applied) {
  console.error("ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD 를 backend/.env 에 설정하세요.");
  process.exit(1);
}

console.log(
  result.created
    ? `✅ 관리자 계정 생성: ${result.email}`
    : `✅ 관리자 비밀번호 갱신: ${result.email}`
);
console.log("   로그인 후 비밀번호를 꼭 변경하세요.");
