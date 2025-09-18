// src/components/ConnectBankButton.tsx
"use client";

import Script from "next/script";
import { useCallback, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE!; // e.g. https://approve-guard.onrender.com (no trailing slash)

export default function ConnectBankButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPlaid = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) Get a link_token from your backend
      const r = await fetch(`${API}/v1/plaid/link-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({ userId: "<optional>" }), // not required
      });
      if (!r.ok) throw new Error(`link-token ${r.status}`);
      const { link_token } = await r.json();

      // 2) Create the Plaid Link handler and open it
      const Plaid = (window as any).Plaid;
      if (!Plaid) throw new Error("Plaid JS not loaded");
      const handler = Plaid.create({
        token: link_token,
        onSuccess: async (public_token: string) => {
          // 3) Exchange the public_token on your backend
          const ex = await fetch(`${API}/v1/plaid/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_token }),
          });
          if (!ex.ok) {
            console.error("Exchange failed", await ex.text());
          } else {
            console.log("✅ Exchange ok");
          }
        },
        onExit: (err: any) => {
          if (err) console.warn("Plaid exit", err);
        },
      });

      handler.open();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      {/* Loads Plaid Link JS once on the page */}
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        strategy="afterInteractive"
      />
      <button
        onClick={openPlaid}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
      >
        {loading ? "Connecting…" : "Connect your bank"}
      </button>
      {error ? (
        <p className="text-sm text-red-600 mt-2">Error: {error}</p>
      ) : null}
    </>
  );
}
