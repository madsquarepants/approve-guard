// src/hooks/usePlaid.ts
import { useCallback, useState } from "react";

// TEMP hardcode so we know it's calling the right API
const API = "https://approve-guard.onrender.com"; // no trailing slash

export const usePlaid = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLinkToken = useCallback(async (): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/v1/plaid/link-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // optional
      });
      if (!res.ok) throw new Error(`link-token ${res.status}`);
      const data = await res.json();
      if (!data.link_token) throw new Error("No link_token in response");
      return data.link_token as string;
    } catch (e) {
      setError("Failed to create link token");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const exchangePublicToken = useCallback(async (public_token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/v1/plaid/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token }),
      });
      if (!res.ok) throw new Error(`exchange ${res.status}`);
      return await res.json().catch(() => ({}));
    } catch (e) {
      setError("Failed to exchange public token");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createLinkToken, exchangePublicToken, loading, error };
};
