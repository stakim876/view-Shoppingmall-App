import nodemailer from "nodemailer";

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || "false") === "true";
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function sendPasswordResetEmail({ toEmail, resetUrl }) {
  const transporter = buildTransport();
  if (!transporter) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from: fromAddress,
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

  return { sent: true };
}

export async function sendRestockAlertEmail({ toEmail, productName, productUrl }) {
  const transporter = buildTransport();
  if (!transporter) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from: fromAddress,
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

  return { sent: true };
}
