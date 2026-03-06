import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * 비밀번호 해시 생성
 * @param {string} password - 평문 비밀번호
 * @returns {Promise<string>} 해시된 비밀번호
 */
export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 비밀번호 검증
 * @param {string} password - 평문 비밀번호
 * @param {string} hashedPassword - 해시된 비밀번호
 * @returns {Promise<boolean>} 일치 여부
 */
export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * JWT 토큰 생성
 * @param {Object} payload - 토큰에 포함할 데이터
 * @returns {string} JWT 토큰
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * JWT 토큰 검증
 * @param {string} token - JWT 토큰
 * @returns {Object|null} 디코딩된 토큰 데이터 또는 null
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * JWT 인증 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "인증 토큰이 필요합니다.",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({
      success: false,
      message: "유효하지 않은 토큰입니다.",
    });
  }

  req.user = decoded;
  next();
}
