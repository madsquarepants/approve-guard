// src/hooks/usePlaid.ts
import { useEffect, useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8080";

export function usePlaidLinkFlow(userId: string | null = null) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [exchangeResult, setExchangeResult] = useState<any>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // 1) Get link_token from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setInitError(null);
        const res = await fetch(`${API_BASE}/v1/plaid/link-token`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userId: userId ?? "anonymous" }),
        });
        if (!res.ok) throw new Error(`link-token HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setLinkToken(json.link_token);
      } catch (e: any) {
        if (!cancelled)
          setInitError(e?.message || "Failed to initialize bank connection");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 2) Exchange public_token on backend
  const onSuccess = useCallback(async (public_token: string) => {
    try {
      const res = await fetch(`${API_BASE}/v1/plaid/exchange`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ public_token }),
      });
      const json = await res.json();
      setExchangeResult(json);
    } catch (e) {
      console.error("exchange failed", e);
    }
  }, []);

  const { open, ready, error } = usePlaidLink({
    token: linkToken || "",
    onSuccess,
    onExit: (err) => err && console.error("plaid exit", err),
  });

  return {
    open,
    ready: Boolean(linkToken) && ready,
    error: (initError || (error as any)) as string | null,
    exchangeResult,
    linkToken,
  };
}

export default usePlaidLinkFlow;
