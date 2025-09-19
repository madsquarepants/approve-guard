// src/lib/plaidClient.ts
import { API } from "@/lib/config";

export type PlaidTx = {
  transaction_id: string;
  name: string;
  date: string;        // YYYY-MM-DD
  amount: number;      // Plaid: debits are negative, credits positive
  pending?: boolean;
};

export async function fetchPlaidTransactions(days = 30): Promise<PlaidTx[]> {
  const r = await fetch(`${API}/v1/plaid/transactions?days=${days}&count=250`);
  if (!r.ok) throw new Error(await r.text());
  const { transactions } = await r.json();
  return (transactions || []) as PlaidTx[];
}

export function calcMonthlySpend(txs: PlaidTx[]) {
  // "Spend" = sum of debits in the last N days (absolute value)
  return txs
    .filter(t => typeof t.amount === "number" && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}
