// src/pages/Dashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ui/theme-toggle";

import {
  CreditCard,
  Settings,
  Bell,
  Check,
  X,
  Eye,
  LogOut,
  Banknote,
} from "lucide-react";
import { PlaidLink } from "@/components/PlaidLink";
import BankAccountsCard from "@/components/BankAccountsCard";
import TransactionList from "@/components/TransactionList";
import { fetchPlaidTransactions, calcMonthlySpend } from "@/lib/plaidClient";
import { inferSubscriptionsFromTransactions, DetectedSubscription } from "@/lib/subscriptionsFromPlaid";
import { API } from "@/lib/config";

const Dashboard = () => {
  const navigate = useNavigate();

  // Plaid-driven monthly spend
  const [monthlySpendPlaid, setMonthlySpendPlaid] = useState<number | null>(null);
  const [loadingSpend, setLoadingSpend] = useState(false);

  // Plaid-inferred subscriptions
  const [subscriptions, setSubscriptions] = useState<DetectedSubscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Show big Link banner only if no accounts yet
  const [showPlaidLink, setShowPlaidLink] = useState(true);

  const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });

  // Load monthly spend (30d debits)
  useEffect(() => {
    (async () => {
      try {
        setLoadingSpend(true);
        const txs = await fetchPlaidTransactions(30);
        setMonthlySpendPlaid(calcMonthlySpend(txs));
      } catch (e) {
        console.error("Failed to load Plaid spend", e);
      } finally {
        setLoadingSpend(false);
      }
    })();
  }, []);

  // Hide Link banner if accounts already exist
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/v1/plaid/accounts`);
        if (res.ok) setShowPlaidLink(false);
      } catch { /* keep banner visible on error */ }
    })();
  }, []);

  // Infer subscriptions from Plaid (last 90d gives better signal)
  useEffect(() => {
    (async () => {
      try {
        setLoadingSubs(true);
        const txs = await fetchPlaidTransactions(90);
        const inferred = inferSubscriptionsFromTransactions(txs);
        setSubscriptions(inferred);
      } catch (e) {
        console.error("Failed to infer subscriptions", e);
        setSubscriptions([]);
      } finally {
        setLoadingSubs(false);
      }
    })();
  }, []);

  // Approve / Deny
  const handleApprove = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "active" as const } : s))
    );
  };
  const handleDeny = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "denied" as const } : s))
    );
  };

  const pendingCount = subscriptions.filter((s) => s.status === "pending").length;
  const activeCount = subscriptions.filter((s) => s.status === "active").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-card-foreground">Paylio</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
          
              </Button>
              {/* 🌙/☀️ Dark mode switch */}
  <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Monthly Spend (Plaid) */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Spend</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {loadingSpend
                      ? "…"
                      : monthlySpendPlaid != null
                      ? money.format(monthlySpendPlaid)
                      : money.format(0)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Approval (from inferred subs) */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-warning/10 to-warning/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold text-card-foreground">{pendingCount}</p>
                </div>
                <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Subscriptions (from inferred subs) */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-card-foreground">{activeCount}</p>
                </div>
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Connection Section */}
        {showPlaidLink && (
          <Card className="border-0 shadow-lg mb-8 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Connect Your Bank</h3>
                  <p className="text-sm text-muted-foreground">
                    Link your bank account to monitor transactions and manage approvals
                  </p>
                </div>
              </div>
              <PlaidLink
                onSuccess={() => {
                  setShowPlaidLink(false);
                  window.location.reload(); // quick refresh so cards update
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Account Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TransactionList />
          <BankAccountsCard />
        </div>

        {/* Subscriptions List (from Plaid inference) */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <h2 className="text-xl font-semibold text-card-foreground">Your Subscriptions</h2>
            <p className="text-sm text-muted-foreground">
              {loadingSubs
                ? "Scanning transactions…"
                : subscriptions.length
                ? "Manage your recurring charges and approve upcoming payments"
                : "No subscriptions detected yet"}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {subscriptions.length === 0 && !loadingSubs ? (
              <div className="p-6 text-sm text-muted-foreground">Nothing found yet.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {subscriptions.map((s) => (
                  <div key={s.id} className="p-6 hover:bg-accent/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-card-foreground">{s.merchant}</h3>
                          <Badge
                            variant={
                              s.status === "active"
                                ? "active"
                                : s.status === "pending"
                                ? "pending"
                                : "denied"
                            }
                          >
                            {s.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>${s.amount} / {s.frequency}</span>
                          <span>•</span>
                          <span>Next: {s.nextCharge}</span>
                          <span>•</span>
                          <span>{s.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/subscription/${s.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>

                        {s.status === "pending" && (
                          <>
                            <Button variant="approve" size="sm" onClick={() => handleApprove(s.id)}>
                              <Check className="w-4 h-4" /> Approve
                            </Button>
                            <Button variant="deny" size="sm" onClick={() => handleDeny(s.id)}>
                              <X className="w-4 h-4" /> Deny
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
