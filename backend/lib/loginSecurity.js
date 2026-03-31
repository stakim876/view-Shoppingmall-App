const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const ATTEMPT_WINDOW_MS = Number(process.env.LOGIN_ATTEMPT_WINDOW_MS || 15 * 60 * 1000);
const LOCKOUT_MS = Number(process.env.LOGIN_LOCKOUT_MS || 15 * 60 * 1000);
const CAPTCHA_THRESHOLD = Number(process.env.LOGIN_CAPTCHA_THRESHOLD || 3);

export function createLoginAttemptStore(now = () => Date.now()) {
  const attempts = new Map();

  function getState(key) {
    const existing = attempts.get(key);
    const current = now();
    if (!existing) {
      return {
        count: 0,
        firstFailedAt: null,
        lockUntil: null,
      };
    }

    if (existing.lockUntil && current >= existing.lockUntil) {
      attempts.delete(key);
      return {
        count: 0,
        firstFailedAt: null,
        lockUntil: null,
      };
    }

    if (existing.firstFailedAt && current - existing.firstFailedAt > ATTEMPT_WINDOW_MS) {
      attempts.delete(key);
      return {
        count: 0,
        firstFailedAt: null,
        lockUntil: null,
      };
    }

    return existing;
  }

  function isLocked(key) {
    const state = getState(key);
    const current = now();
    return Boolean(state.lockUntil && current < state.lockUntil);
  }

  function registerFailure(key) {
    const current = now();
    const state = getState(key);
    const nextCount = state.count + 1;
    const nextState = {
      count: nextCount,
      firstFailedAt: state.firstFailedAt ?? current,
      lockUntil: null,
    };

    if (nextCount >= MAX_LOGIN_ATTEMPTS) {
      nextState.lockUntil = current + LOCKOUT_MS;
    }

    attempts.set(key, nextState);
    return nextState;
  }

  function clear(key) {
    attempts.delete(key);
  }

  function shouldRequireCaptcha(key) {
    const state = getState(key);
    return state.count >= CAPTCHA_THRESHOLD;
  }

  function remainingLockMs(key) {
    const state = getState(key);
    if (!state.lockUntil) return 0;
    return Math.max(0, state.lockUntil - now());
  }

  return {
    isLocked,
    registerFailure,
    clear,
    shouldRequireCaptcha,
    remainingLockMs,
  };
}

export function buildLoginAttemptKey(email, ip = "") {
  return `${String(email || "").toLowerCase()}::${String(ip || "")}`;
}
