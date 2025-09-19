import { useEffect, useState } from "react";
import { API } from "@/lib/config";

// Very light type so TS doesn't complain
type PlaidAccount = {
  account_id: string;
  name?: string;
  official_name?: string;
  subtype?: string;
  mask?: string;
  balances?: {
    current?: number;
    available?: number;
    iso_currency_code?: string;
  };
};

export default function BankAccountsCard() {
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const r = await fetch(`${API}/v1/plaid/accounts`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setAccounts(data.accounts ?? []);
    } catch (e: any) {
      setErr(e.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }

  // fetch once when the component shows
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 rounded-xl border">
      <h3 className="text-lg font-semibold mb-3">Bank Accounts</h3>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {err && <p className="text-sm text-red-600">Error: {err}</p>}

      {!loading && !err && accounts.length === 0 && (
        <p className="text-sm text-muted-foreground">No accounts yet.</p>
      )}

      <ul className="space-y-2">
        {accounts.map((a) => (
          <li key={a.account_id} className="rounded-xl border p-3">
            <div className="font-medium">
              {a.official_name || a.name || "Account"}
            </div>
            <div className="text-sm text-muted-foreground">
              {(a.subtype || "—").toUpperCase()} {a.mask ? `• • • • ${a.mask}` : ""}
            </div>
            <div className="text-sm">
              {(a.balances?.current ?? "-")}{" "}
              {a.balances?.iso_currency_code ?? ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
