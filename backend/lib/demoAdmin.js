import { hashPassword } from "./auth.js";

function resolveDemoAdminCredentials() {
  const isProd = process.env.NODE_ENV === "production";
  const email = String(process.env.ADMIN_BOOTSTRAP_EMAIL || (!isProd ? "admin@myshop.com" : ""))
    .trim()
    .toLowerCase();
  const password = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || (!isProd ? "MyShopAdmin1" : ""));
  return { email, password };
}

export async function ensureDemoAdmin(db) {
  const { email, password } = resolveDemoAdminCredentials();
  if (!email || password.length < 8) {
    return { applied: false, reason: "credentials_not_configured" };
  }

  const hashed = await hashPassword(password);
  const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [email]);

  if (rows.length > 0) {
    await db.query("UPDATE users SET password = ?, role = 'admin' WHERE email = ?", [hashed, email]);
    return { applied: true, email, created: false };
  }

  await db.query(
    "INSERT INTO users (email, password, name, gender, role) VALUES (?, ?, ?, ?, ?)",
    [email, hashed, process.env.ADMIN_BOOTSTRAP_NAME || "관리자", "male", "admin"]
  );
  return { applied: true, email, created: true };
}
