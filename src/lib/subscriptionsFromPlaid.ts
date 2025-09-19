// src/lib/subscriptionsFromPlaid.ts
// Build a simple "recurring charge" guesser from Plaid transactions.

import type { PlaidTx } from "@/lib/plaidClient";

export type DetectedSubscription = {
  id: string;
  merchant: string;
  amount: number;                         // typical charge
  frequency: "Monthly" | "Weekly" | "Unknown";
  status: "pending" | "active" | "denied";
  nextCharge: string;                     // best guess
  category: "Recurring";
};

// quick normalizer for merchant names
function norm(name: string) {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

function median(nums: number[]) {
  const a = [...nums].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export function inferSubscriptionsFromTransactions(txs: PlaidTx[]): DetectedSubscription[] {
  // use debits (spend) only
  const debits = txs.filter((t) => typeof t.amount === "number" && t.amount < 0);

  // group by merchant
  const groups: Record<string, PlaidTx[]> = {};
  for (const t of debits) {
    const key = norm(t.name || "Unknown");
    (groups[key] ||= []).push(t);
  }

  const out: DetectedSubscription[] = [];
  const DAY = 24 * 3600 * 1000;

  for (const [key, arr] of Object.entries(groups)) {
    if (arr.length < 2) continue; // need at least two charges

    // typical amount = median of absolute values
    const amounts = arr.map((t) => Math.abs(t.amount));
    const typical = median(amounts);

    // keep only charges within ±20% of typical
    const similar = arr.filter((t) => {
      const a = Math.abs(t.amount);
      return a >= typical * 0.8 && a <= typical * 1.2;
    });
    if (similar.length < 2) continue;

    // estimate frequency by average gap
    const dates = similar
      .map((t) => new Date(t.date).getTime())
      .sort((a, b) => a - b);

    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) gaps.push((dates[i] - dates[i - 1]) / DAY);
    const avgGap = gaps.length ? gaps.reduce((s, g) => s + g, 0) / gaps.length : 30;

    const frequency: DetectedSubscription["frequency"] =
      avgGap < 10 ? "Weekly" : avgGap < 45 ? "Monthly" : "Unknown";

    const last = dates[dates.length - 1];
    const next = new Date(last + (frequency === "Weekly" ? 7 : 30) * DAY);

    out.push({
      id: `${key}-${typical.toFixed(2)}`,
      merchant: arr[0].name || "Subscription",
      amount: Number(typical.toFixed(2)),
      frequency,
      status: "pending", // start as pending; user can approve/deny
      nextCharge: next.toISOString().slice(0, 10),
      category: "Recurring",
    });
  }

  out.sort((a, b) => a.merchant.localeCompare(b.merchant));
  return out;
}
