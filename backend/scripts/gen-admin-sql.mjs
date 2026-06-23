import bcrypt from "bcrypt";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const email = process.argv[2] || "admin@myshop.com";
const password = process.argv[3] || "MyShopAdmin1";
const dbName = (process.argv[4] || "railway").replace(/`/g, "");

if (password.length < 8) {
  console.error("비밀번호는 8자 이상이어야 합니다.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
if (hash.length !== 60) {
  console.error("내부 오류: bcrypt 해시 길이가 60이 아닙니다.");
  process.exit(1);
}
const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/'/g, "''");

const sql = `-- 아래 전체를 실행한 뒤 로그인: ${email} / (입력한 비밀번호)
-- DB이름은 백틱 USE 줄만 사용. 작은따옴표로 감싸면 안 됩니다.

USE \`${dbName}\`;

INSERT INTO users (email, password, name, gender, role)
VALUES (
  '${esc(email)}',
  '${hash.replace(/'/g, "''")}',
  '관리자',
  'male',
  'admin'
)
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  role = VALUES(role);
`;

const outPath = join(__dirname, "../database/_gen_admin_sql_output.sql");
writeFileSync(outPath, sql, "utf8");

console.log(sql);
console.log(`\n✅ 위와 동일한 내용을 저장했습니다: ${outPath}`);
console.log("   Workbench에서 이 파일을 File → Open SQL Script 로 열고 전체 실행하세요.");
