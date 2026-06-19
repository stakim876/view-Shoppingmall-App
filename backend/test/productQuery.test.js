import test from "node:test";
import assert from "node:assert/strict";
import { buildProductListQuery } from "../lib/productQuery.js";

test("buildProductListQuery 기본값이 안전하게 설정된다", () => {
  const q = buildProductListQuery({});
  assert.equal(q.page, 1);
  assert.equal(q.limit, 20);
  assert.equal(q.sortField, "id");
  assert.equal(q.sortOrder, "DESC");
});

test("buildProductListQuery 검색/필터/정렬 파라미터를 반영한다", () => {
  const q = buildProductListQuery({
    page: "2",
    limit: "10",
    search: "glass",
    category: "병",
    minPrice: "1000",
    maxPrice: "9000",
    sortBy: "price",
    sortOrder: "asc",
  });

  assert.equal(q.page, 2);
  assert.equal(q.limit, 10);
  assert.equal(q.sortField, "price");
  assert.equal(q.sortOrder, "ASC");
  assert.match(q.whereClause, /name LIKE/);
  assert.match(q.whereClause, /category = \?/);
  assert.equal(q.listParams.length, 6 + 2);
  assert.equal(q.countParams.length, 6);
});
