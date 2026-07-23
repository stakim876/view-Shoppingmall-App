import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPricedLineItems,
  sumLineSubtotal,
  totalsMatch,
} from "../lib/orderIntegrity.js";

test("buildPricedLineItems는 DB 가격으로 라인 금액을 계산한다", () => {
  const catalog = new Map([
    [1, { id: 1, name: "티셔츠", price: 19900, stock: 10 }],
    [2, { id: 2, name: "백팩", price: 49000, stock: 3 }],
  ]);

  const result = buildPricedLineItems(
    [
      { id: 1, quantity: 2, price: 1000 },
      { id: 2, quantity: 1, price: 1 },
    ],
    catalog
  );

  assert.equal(result.ok, true);
  assert.equal(result.lines[0].unitPrice, 19900);
  assert.equal(result.lines[0].lineTotal, 39800);
  assert.equal(result.lines[1].unitPrice, 49000);
  assert.equal(sumLineSubtotal(result.lines), 88800);
});

test("buildPricedLineItems는 없는 상품을 거절한다", () => {
  const result = buildPricedLineItems([{ id: 99, quantity: 1 }], new Map());
  assert.equal(result.ok, false);
  assert.equal(result.code, "PRODUCT_NOT_FOUND");
});

test("buildPricedLineItems는 필수 옵션을 검증한다", () => {
  const catalog = new Map([
    [
      1,
      {
        id: 1,
        name: "아이폰 15",
        price: 1500000,
        stock: 10,
        product_options: JSON.stringify([
          { key: "color", label: "색상", values: ["블랙", "블루"] },
          { key: "storage", label: "용량", values: ["128GB", "256GB"] },
        ]),
      },
    ],
  ]);

  const missing = buildPricedLineItems([{ id: 1, quantity: 1 }], catalog);
  assert.equal(missing.ok, false);
  assert.equal(missing.code, "OPTIONS_REQUIRED");

  const ok = buildPricedLineItems(
    [{ id: 1, quantity: 1, options: { color: "블랙", storage: "128GB" } }],
    catalog
  );
  assert.equal(ok.ok, true);
  assert.equal(ok.lines[0].optionsJson, '{"color":"블랙","storage":"128GB"}');
});

test("buildPricedLineItems는 용량 옵션 가격 차이를 반영한다", () => {
  const catalog = new Map([
    [
      1,
      {
        id: 1,
        name: "아이폰 15",
        price: 1500000,
        stock: 10,
        product_options: JSON.stringify([
          { key: "color", label: "색상", values: ["블랙"] },
          {
            key: "storage",
            label: "용량",
            values: [
              { value: "128GB", priceDelta: 0 },
              { value: "256GB", priceDelta: 200000 },
            ],
          },
        ]),
      },
    ],
  ]);

  const base = buildPricedLineItems(
    [{ id: 1, quantity: 1, options: { color: "블랙", storage: "128GB" } }],
    catalog
  );
  const upgraded = buildPricedLineItems(
    [{ id: 1, quantity: 1, options: { color: "블랙", storage: "256GB" } }],
    catalog
  );
  assert.equal(base.ok, true);
  assert.equal(base.lines[0].unitPrice, 1500000);
  assert.equal(upgraded.ok, true);
  assert.equal(upgraded.lines[0].unitPrice, 1700000);
});

test("totalsMatch는 허용 오차 내에서 금액을 비교한다", () => {
  assert.equal(totalsMatch(10000, 10000), true);
  assert.equal(totalsMatch(10000.4, 10000), true);
  assert.equal(totalsMatch(10002, 10000), false);
});
