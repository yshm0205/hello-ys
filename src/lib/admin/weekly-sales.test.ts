import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWeeklySalesRows,
  getKstWeekStart,
  getWeeklySalesQueryRange,
} from "./weekly-sales.js";

test("starts each reporting week on Sunday at midnight in Korea", () => {
  assert.equal(
    getKstWeekStart(new Date("2026-09-01T12:00:00.000Z")).toISOString(),
    "2026-08-29T15:00:00.000Z",
  );
});

test("builds a 12-week query range that includes the current week", () => {
  const range = getWeeklySalesQueryRange(new Date("2026-09-01T12:00:00.000Z"), 12);

  assert.equal(range.start.toISOString(), "2026-06-13T15:00:00.000Z");
  assert.equal(range.end.toISOString(), "2026-09-05T15:00:00.000Z");
});

test("aggregates completed sales and subtracts partial refunds", () => {
  const rows = buildWeeklySalesRows(
    [
      {
        created_at: "2026-08-30T01:00:00.000Z",
        amount: 499000,
        status: "DONE",
        metadata: null,
      },
      {
        created_at: "2026-08-31T01:00:00.000Z",
        amount: 499000,
        status: "PARTIAL_CANCELLED",
        metadata: { cancelledAmount: 20000 },
      },
      {
        created_at: "2026-08-31T02:00:00.000Z",
        amount: 499000,
        status: "CANCELED",
        metadata: null,
      },
    ],
    new Date("2026-09-01T12:00:00.000Z"),
    2,
  );

  assert.equal(rows[0].salesCount, 2);
  assert.equal(rows[0].netRevenue, 978000);
});
