const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const SALES_STATUSES = new Set(["DONE", "PARTIAL_CANCELLED"]);

export interface WeeklySalesPayment {
  readonly created_at: string;
  readonly amount: number;
  readonly status: string;
  readonly metadata: Readonly<Record<string, unknown>> | null;
}

export interface WeeklySalesRow {
  readonly weekStart: Date;
  readonly weekEnd: Date;
  readonly salesCount: number;
  readonly netRevenue: number;
}

function getNumericMetadata(
  metadata: Readonly<Record<string, unknown>> | null,
  key: string,
) {
  const value = metadata?.[key];

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getNetRevenue(payment: WeeklySalesPayment) {
  if (payment.status === "DONE") {
    return payment.amount;
  }

  const cancelledAmount = getNumericMetadata(payment.metadata, "cancelledAmount");
  return Math.max(0, payment.amount - cancelledAmount);
}

export function getKstWeekStart(date: Date) {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);
  const startAsUtc = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() - shifted.getUTCDay(),
  );

  return new Date(startAsUtc - KST_OFFSET_MS);
}

export function getWeeklySalesQueryRange(now = new Date(), weekCount = 12) {
  const normalizedWeekCount = Math.max(2, Math.floor(weekCount));
  const currentWeekStart = getKstWeekStart(now);

  return {
    start: new Date(currentWeekStart.getTime() - (normalizedWeekCount - 1) * WEEK_MS),
    end: new Date(currentWeekStart.getTime() + WEEK_MS),
  };
}

export function buildWeeklySalesRows(
  payments: readonly WeeklySalesPayment[],
  now = new Date(),
  weekCount = 12,
) {
  const normalizedWeekCount = Math.max(2, Math.floor(weekCount));
  const range = getWeeklySalesQueryRange(now, normalizedWeekCount);
  const mutableRows = Array.from({ length: normalizedWeekCount }, (_, index) => ({
    weekStart: new Date(range.start.getTime() + index * WEEK_MS),
    weekEnd: new Date(range.start.getTime() + (index + 1) * WEEK_MS),
    salesCount: 0,
    netRevenue: 0,
  }));

  for (const payment of payments) {
    if (!SALES_STATUSES.has(payment.status)) {
      continue;
    }

    const paidAt = new Date(payment.created_at);
    if (Number.isNaN(paidAt.getTime())) {
      continue;
    }

    const rowIndex = Math.floor((paidAt.getTime() - range.start.getTime()) / WEEK_MS);
    if (rowIndex < 0 || rowIndex >= mutableRows.length) {
      continue;
    }

    const netRevenue = getNetRevenue(payment);
    if (netRevenue <= 0) {
      continue;
    }

    const row = mutableRows[rowIndex];
    row.salesCount += 1;
    row.netRevenue += netRevenue;
  }

  return mutableRows.reverse() satisfies WeeklySalesRow[];
}
