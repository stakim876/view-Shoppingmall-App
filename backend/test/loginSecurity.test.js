import test from "node:test";
import assert from "node:assert/strict";
import { createLoginAttemptStore } from "../lib/loginSecurity.js";

test("locks after max failures and unlocks after timeout", () => {
  let current = 0;
  const now = () => current;
  const store = createLoginAttemptStore(now);
  const key = "user@example.com::127.0.0.1";

  for (let i = 0; i < 5; i += 1) {
    store.registerFailure(key);
  }

  assert.equal(store.isLocked(key), true);
  assert.ok(store.remainingLockMs(key) > 0);

  current += 16 * 60 * 1000;
  assert.equal(store.isLocked(key), false);
});

test("requires captcha after threshold", () => {
  const store = createLoginAttemptStore(() => Date.now());
  const key = "user@example.com::127.0.0.1";

  assert.equal(store.shouldRequireCaptcha(key), false);
  store.registerFailure(key);
  store.registerFailure(key);
  store.registerFailure(key);
  assert.equal(store.shouldRequireCaptcha(key), true);
});

test("clear removes failure history", () => {
  const store = createLoginAttemptStore(() => Date.now());
  const key = "user@example.com::127.0.0.1";
  store.registerFailure(key);
  store.registerFailure(key);
  store.clear(key);
  assert.equal(store.shouldRequireCaptcha(key), false);
  assert.equal(store.isLocked(key), false);
});
