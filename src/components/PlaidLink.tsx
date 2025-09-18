"use client";

import { useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PlaidLinkProps {
  onSuccess?: () => void;
}

// ✅ FORCE the correct backend for now
const API = "https://approve-guard.onrender.com"; // no trailing slash

const PlaidLink = ({ onSuccess }: PlaidLinkProps) => {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);

      // 1) Get link_token from the backend
      const r = await fetch(`${API}/v1/plaid/link-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // body optional
      });
      if (!r.ok) throw new Error(`link-token ${r.status}`);
      const { link_token } = await r.json();

      // 2) Open Plaid Link (uses the script below)
      const Plaid = (window as any).Plaid;
      if (!Plaid) {
        toast.error("Plaid JS not loaded");
        return;
      }
      const handler = Plaid.create({
        token: link_token,
        onSuccess: async (public_token: string) => {
          // 3) Exchange public_token on backend
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
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect bank");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      {/* Loads Plaid Link SDK */}
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        strategy="afterInteractive"
      />
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
