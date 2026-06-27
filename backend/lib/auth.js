/*
 * [면접] 로그인·인증 핵심
 * Q. 로그인하면 뭐가 저장되나? → DB 비밀번호(해시) 비교 후 JWT 발급 → 프론트 localStorage
 * Q. authenticateToken? → 주문/마이페이지 같은 "로그인 필수" API 앞의 문지기
 */
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required. Set JWT_SECRET in backend/.env");
  }
  return secret;
}

export async function hashPassword(password) {
  // [면접] 회원가입 시 평문 비밀번호 → bcrypt 해시 (DB에는 해시만 저장)
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "인증 토큰이 필요합니다.",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다.",
    });
  }

  req.user = decoded;
  next();
}

export function optionalAuthenticate(req, _res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return next();
  }
  const decoded = verifyToken(token);
  if (decoded) {
    req.user = decoded;
  }
  next();
}
