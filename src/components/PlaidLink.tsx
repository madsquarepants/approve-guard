import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PlaidLinkProps {
  onSuccess?: () => void;
}

// ✅ Force correct backend for now
const API = "https://approve-guard.onrender.com"; // no trailing slash

// Load Plaid JS once (works in Vite)
function loadPlaidScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Plaid) return resolve();
    const s = document.createElement("script");
    s.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Plaid JS failed to load"));
    document.body.appendChild(s);
  });
}

const PlaidLink: React.FC<PlaidLinkProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);

      // 1) Ensure Plaid JS is on the page
      await loadPlaidScript();

      // 2) Get link_token from backend
      const r = await fetch(`${API}/v1/plaid/link-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // optional
      });
      if (!r.ok) throw new Error(`link-token ${r.status}`);
      const { link_token } = await r.json();

      // 3) Open Plaid Link
      const Plaid = (window as any).Plaid;
      if (!Plaid) throw new Error("Plaid not available");
      const handler = Plaid.create({
        token: link_token,
        onSuccess: async (public_token: string) => {
          // 4) Exchange public_token on backend
          const ex = await fetch(`${API}/v1/plaid/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_token }),
          });
          if (!ex.ok) {
            toast.error("Exchange failed");
            return;
          }
          toast.success("Bank connected!");
          onSuccess?.();
        },
        onExit: () => {},
      });

      handler.open();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to connect bank");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold mb-4">Connect Your Bank Account</h3>
      <p className="text-muted-foreground mb-6">
        Securely connect your bank account to start monitoring transactions.
      </p>
      <Button onClick={handleConnect} disabled={loading} size="lg">
        {loading ? "Connecting…" : "Connect Bank Account"}
      </Button>
    </div>
  );
};

export { PlaidLink };
export default PlaidLink;
