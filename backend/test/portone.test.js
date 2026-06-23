import test from "node:test";
import assert from "node:assert/strict";
import { isPortOneVerificationEnabled } from "../lib/portone.js";

test("isPortOneVerificationEnabled is false without credentials", () => {
  const prevKey = process.env.PORTONE_API_KEY;
  const prevSecret = process.env.PORTONE_API_SECRET;
  delete process.env.PORTONE_API_KEY;
  delete process.env.PORTONE_API_SECRET;
  assert.equal(isPortOneVerificationEnabled(), false);
  if (prevKey) process.env.PORTONE_API_KEY = prevKey;
  if (prevSecret) process.env.PORTONE_API_SECRET = prevSecret;
});

test("isPortOneVerificationEnabled is true with both credentials", () => {
  const prevKey = process.env.PORTONE_API_KEY;
  const prevSecret = process.env.PORTONE_API_SECRET;
  process.env.PORTONE_API_KEY = "test_key";
  process.env.PORTONE_API_SECRET = "test_secret";
  assert.equal(isPortOneVerificationEnabled(), true);
  if (prevKey) process.env.PORTONE_API_KEY = prevKey;
  else delete process.env.PORTONE_API_KEY;
  if (prevSecret) process.env.PORTONE_API_SECRET = prevSecret;
  else delete process.env.PORTONE_API_SECRET;
});
