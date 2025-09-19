// src/components/RecentTransactionsCard.tsx
import { useEffect, useState } from "react";
import { API } from "@/lib/config";

// currency formatter (keep only this one)
const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });

type Tx = {
  transaction_id: string;
  name?: string;
  date?: string; // YYYY-MM-DD
  amount?: number;
  iso_currency_code?: string;
};

export default function RecentTransactionsCard() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      // last 12 months to guarantee sandbox data
      const r = await fetch(`${API}/v1/plaid/transactions?days=365&count=25`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setTxs(data.transactions ?? []);
    } catch (e: any) {
      setErr(e.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 rounded-xl border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        <button className="text-sm underline" onClick={load}>Sync</button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {err && <p className="text-sm text-red-600">Error: {err}</p>}
      {!loading && !err && txs.length === 0 && (
        <p className="text-sm text-muted-foreground">No recent transactions.</p>
      )}

      <ul className="divide-y">
        {txs.map((t) => (
          <li key={t.transaction_id} className="py-2 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.name || "Transaction"}</div>
              <div className="text-xs text-muted-foreground">{t.date}</div>
            </div>

            {/* colored + right-aligned amount */}
            <div
              className={
                "text-sm tabular-nums text-right " +
                ((t.amount ?? 0) < 0 ? "text-red-600" : "text-emerald-600")
              }
            >
              {typeof t.amount === "number" ? money.format(t.amount) : "-"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
