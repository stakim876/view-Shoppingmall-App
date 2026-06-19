import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchRelevanceSql, getSearchEngineMode } from "../lib/searchEngine.js";

test("buildSearchRelevanceSql returns scoring params", () => {
  const result = buildSearchRelevanceSql("맥북");
  assert.match(result.expr, /WHEN name = \? THEN 100/);
  assert.equal(result.params.length, 5);
});

test("getSearchEngineMode defaults to mysql", () => {
  const prev = process.env.ELASTICSEARCH_URL;
  delete process.env.ELASTICSEARCH_URL;
  assert.equal(getSearchEngineMode(), "mysql");
  if (prev) process.env.ELASTICSEARCH_URL = prev;
});
