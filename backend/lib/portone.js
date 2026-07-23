import axios from "axios";

function getCredentials() {
  const impKey = String(process.env.PORTONE_API_KEY || process.env.IMP_KEY || "").trim();
  const impSecret = String(process.env.PORTONE_API_SECRET || process.env.IMP_SECRET || "").trim();
  return { impKey, impSecret };
}

export function isPortOneVerificationEnabled() {
  const { impKey, impSecret } = getCredentials();
  return Boolean(impKey && impSecret);
}

async function fetchAccessToken(impKey, impSecret) {
  const { data } = await axios.post(
    "https://api.iamport.kr/users/getToken",
    { imp_key: impKey, imp_secret: impSecret },
    { timeout: 15000 }
  );
  const token = data?.response?.access_token;
  if (!token) {
    throw new Error(data?.message || "포트원 토큰 발급 실패");
  }
  return token;
}

export async function verifyPortOnePayment({ impUid, expectedAmount }) {
  const uid = String(impUid || "");
  if (uid.startsWith("dev_imp_")) {
    return { verified: true, skipped: true, reason: "dev_mock_payment" };
  }

  const { impKey, impSecret } = getCredentials();
  if (!impKey || !impSecret) {
    return { verified: false, skipped: true, reason: "portone_not_configured" };
  }
  if (!impUid) {
    return { verified: false, skipped: false, reason: "missing_imp_uid" };
  }

  const accessToken = await fetchAccessToken(impKey, impSecret);
  const { data } = await axios.get(`https://api.iamport.kr/payments/${encodeURIComponent(impUid)}`, {
    headers: { Authorization: accessToken },
    timeout: 15000,
  });

  const payment = data?.response;
  if (!payment) {
    return { verified: false, skipped: false, reason: "payment_not_found" };
  }

  const paidAmount = Number(payment.amount);
  const status = String(payment.status || "");
  if (status !== "paid") {
    return { verified: false, skipped: false, reason: `status_${status || "unknown"}` };
  }

  const expected = Number(expectedAmount);
  if (Number.isFinite(expected) && Math.abs(paidAmount - expected) > 1) {
    return {
      verified: false,
      skipped: false,
      reason: "amount_mismatch",
      paidAmount,
      expectedAmount: expected,
    };
  }

  return {
    verified: true,
    skipped: false,
    paidAmount,
    merchantUid: payment.merchant_uid || null,
    payMethod: payment.pay_method || null,
  };
}

export async function cancelPortOnePayment({ impUid, amount, reason }) {
  const uid = String(impUid || "");
  if (!uid) {
    return { cancelled: false, skipped: true, reason: "missing_imp_uid" };
  }
  if (uid.startsWith("dev_imp_")) {
    return { cancelled: true, skipped: true, reason: "dev_mock_payment" };
  }

  const { impKey, impSecret } = getCredentials();
  if (!impKey || !impSecret) {
    return { cancelled: false, skipped: true, reason: "portone_not_configured" };
  }

  const accessToken = await fetchAccessToken(impKey, impSecret);
  const body = {
    imp_uid: uid,
    reason: String(reason || "고객 요청 취소").slice(0, 200),
  };
  const amt = Number(amount);
  if (Number.isFinite(amt) && amt > 0) {
    body.amount = amt;
  }

  const { data } = await axios.post("https://api.iamport.kr/payments/cancel", body, {
    headers: { Authorization: accessToken },
    timeout: 20000,
  });

  if (data?.code !== 0) {
    throw new Error(data?.message || "포트원 결제 취소 실패");
  }

  return {
    cancelled: true,
    skipped: false,
    raw: data?.response || null,
  };
}
