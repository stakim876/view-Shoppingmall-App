import axios from "axios";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

function getCaptchaConfig() {
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    return { provider: "turnstile", secret: turnstileSecret, verifyUrl: TURNSTILE_VERIFY_URL };
  }
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  if (recaptchaSecret) {
    return { provider: "recaptcha", secret: recaptchaSecret, verifyUrl: RECAPTCHA_VERIFY_URL };
  }
  return null;
}

export async function verifyCaptchaToken(token, remoteip) {
  const config = getCaptchaConfig();
  if (!config) {
    return { enabled: false, success: true, provider: "none" };
  }
  if (!token) {
    return { enabled: true, success: false, provider: config.provider };
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", config.secret);
    params.append("response", token);
    if (remoteip) params.append("remoteip", remoteip);

    const response = await axios.post(config.verifyUrl, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 5000,
    });

    return {
      enabled: true,
      success: Boolean(response?.data?.success),
      provider: config.provider,
      errors: response?.data?.["error-codes"] || [],
    };
  } catch (error) {
    return {
      enabled: true,
      success: false,
      provider: config.provider,
      errors: ["captcha_verification_failed"],
    };
  }
}
