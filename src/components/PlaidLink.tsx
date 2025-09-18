"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePlaid } from "@/hooks/usePlaid";

interface PlaidLinkProps {
  onSuccess?: () => void;
}

export const PlaidLink = ({ onSuccess }: PlaidLinkProps) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { createLinkToken, exchangePublicToken, loading, error } = usePlaid();

  useEffect(() => {
    const initializePlaid = async () => {
      try {
        const token = await createLinkToken();
        setLinkToken(token);
      } catch (err) {
        console.error("Failed to initialize Plaid:", err);
        toast.error("Failed to initialize bank connection");
      }
    };
    initializePlaid();
  }, [createLinkToken]);

  const handlePlaidLink = async () => {
    if (!linkToken) {
      toast.error("Link token not ready");
      return;
    }

    try {
      // TEMP demo flow (replace with real Plaid Link later)
      toast.info("Opening Plaid Link…");
      const mockPublicToken =
        "public-sandbox-" + Math.random().toString(36).slice(2);
      await exchangePublicToken(mockPublicToken);
      toast.success("Bank account connected successfully!");
      onSuccess?.();
    } catch {
      toast.error("Failed to open Plaid Link");
    }
  };

  if (error) {
    return (
      <div className="text-center">
        <p className="text-destructive mb-4">Error: {error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold mb-4">Connect Your Bank Account</h3>
      <p className="text-muted-foreground mb-6">
        Securely connect your bank account to start monitoring transactions and
        managing approvals.
      </p>
      <Button onClick={handlePlaidLink} disabled={loading || !linkToken} size="lg">
        {loading ? "Loading..." : "Connect Bank Account"}
      </Button>
    </div>
  );
};

export default PlaidLink;
