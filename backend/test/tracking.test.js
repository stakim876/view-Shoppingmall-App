import test from "node:test";
import assert from "node:assert/strict";
import { buildTrackingUrl, isValidCarrierCode } from "../lib/tracking.js";

test("buildTrackingUrl returns CJ URL", () => {
  const u = buildTrackingUrl("cj", "123456789012");
  assert.ok(u.includes("cjlogistics.com"));
  assert.ok(u.includes("123456789012"));
});

test("buildTrackingUrl returns null for empty number", () => {
  assert.equal(buildTrackingUrl("cj", ""), null);
  assert.equal(buildTrackingUrl("cj", "   "), null);
});

test("isValidCarrierCode", () => {
  assert.equal(isValidCarrierCode("cj"), true);
  assert.equal(isValidCarrierCode("invalid"), false);
});
