import nodemailer from "nodemailer";

const PLACEHOLDER_SMTP_RE = /your-|example\.com|placeholder|xxxx/i;

let etherealAccount = null;
let etherealTransport = null;

function isSmtpPlaceholder(value) {
  return PLACEHOLDER_SMTP_RE.test(String(value || ""));
}

function isEtherealDevEnabled() {
  const flag = String(process.env.SMTP_DEV_ETHEREAL || "").trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;

  const host = String(process.env.SMTP_HOST || "").trim();
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  if (!host || !user || !pass) return true;
  if (isSmtpPlaceholder(host) || isSmtpPlaceholder(user) || isSmtpPlaceholder(pass)) return true;
  return false;
}

async function getEtherealTransport() {
  if (etherealTransport) return etherealTransport;
  etherealAccount = await nodemailer.createTestAccount();
  etherealTransport = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: etherealAccount.user,
      pass: etherealAccount.pass,
    },
  });
  console.log("📧 개발용 Ethereal SMTP 활성화:", etherealAccount.user);
  return etherealTransport;
}

async function resolveTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || "false") === "true";

  if (host && user && pass && !isSmtpPlaceholder(host) && !isSmtpPlaceholder(user) && !isSmtpPlaceholder(pass)) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      }),
      fromAddress: process.env.SMTP_FROM || process.env.SMTP_USER,
      mode: "smtp",
    };
  }

  if (!isEtherealDevEnabled()) {
    return null;
  }

  const transporter = await getEtherealTransport();
  return {
    transporter,
    fromAddress: `"My Shop Dev" <${etherealAccount.user}>`,
    mode: "ethereal",
  };
}

async function sendMail(message) {
  const resolved = await resolveTransport();
  if (!resolved) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  const info = await resolved.transporter.sendMail({
    from: resolved.fromAddress,
    ...message,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 메일 미리보기 (${message.subject}): ${previewUrl}`);
  }

  return {
    sent: true,
    previewUrl: previewUrl || null,
    mode: resolved.mode,
  };
}

export async function sendPasswordResetEmail({ toEmail, resetUrl }) {
  return sendMail({
    to: toEmail,
    subject: "[My Shop] 비밀번호 재설정 안내",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2 style="margin:0 0 12px">비밀번호 재설정</h2>
        <p>아래 버튼을 눌러 비밀번호를 재설정해주세요.</p>
        <p style="margin:20px 0">
          <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:10px 16px;text-decoration:none;border-radius:8px">
            비밀번호 재설정하기
          </a>
        </p>
        <p>링크가 열리지 않으면 아래 주소를 브라우저에 붙여넣어 주세요.</p>
        <p style="word-break:break-all;color:#4b5563">${resetUrl}</p>
      </div>
    `,
  });
}

export async function sendRestockAlertEmail({ toEmail, productName, productUrl }) {
  return sendMail({
    to: toEmail,
    subject: `[My Shop] ${productName} 재입고 알림`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2 style="margin:0 0 12px">요청하신 상품이 재입고되었습니다</h2>
        <p><strong>${productName}</strong> 상품이 다시 구매 가능한 상태입니다.</p>
        <p style="margin:20px 0">
          <a href="${productUrl}" style="background:#2563eb;color:#fff;padding:10px 16px;text-decoration:none;border-radius:8px">
            상품 보러 가기
          </a>
        </p>
        <p>링크가 열리지 않으면 아래 주소를 브라우저에 붙여넣어 주세요.</p>
        <p style="word-break:break-all;color:#4b5563">${productUrl}</p>
      </div>
    `,
  });
}

export async function warmupDevMailer() {
  if (!isEtherealDevEnabled()) return null;
  try {
    await getEtherealTransport();
    return { ready: true };
  } catch (err) {
    console.warn("⚠️ Ethereal SMTP 준비 실패:", err.message);
    return { ready: false, error: err.message };
  }
}
