import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Settings, Bell, Check, X, Eye, LogOut, Banknote } from "lucide-react";
import { PlaidLink } from "@/components/PlaidLink";
import { AccountCard } from "@/components/AccountCard";
import BankAccountsCard from "@/components/BankAccountsCard";
import  TransactionList  from "@/components/TransactionList";

interface Subscription {
  id: string;
  merchant: string;
  amount: number;
  frequency: "Monthly" | "Annual" | "Weekly";
  status: "active" | "pending" | "denied";
  nextCharge: string;
  category: string;
}

const mockSubscriptions: Subscription[] = [
  {
    id: "1",
    merchant: "Netflix",
    amount: 15.99,
    frequency: "Monthly",
    status: "pending",
    nextCharge: "2024-01-15",
    category: "Entertainment"
  },
  {
    id: "2", 
    merchant: "Spotify Premium",
    amount: 9.99,
    frequency: "Monthly",
    status: "active",
    nextCharge: "2024-01-12",
    category: "Music"
  },
  {
    id: "3",
    merchant: "Adobe Creative Cloud",
    amount: 52.99,
    frequency: "Monthly", 
    status: "active",
    nextCharge: "2024-01-20",
    category: "Software"
  },
  {
    id: "4",
    merchant: "Gym Membership",
    amount: 29.99,
    frequency: "Monthly",
    status: "denied",
    nextCharge: "2024-01-10",
    category: "Health & Fitness"
  }
];

const Dashboard = () => {
  const [subscriptions, setSubscriptions] = useState(mockSubscriptions);
  const [showPlaidLink, setShowPlaidLink] = useState(true);
  const navigate = useNavigate();

  const handleApprove = (id: string) => {
    setSubscriptions(prev =>
      prev.map(sub => sub.id === id ? { ...sub, status: "active" as const } : sub)
    );
  };

  const handleDeny = (id: string) => {
    setSubscriptions(prev =>
      prev.map(sub => sub.id === id ? { ...sub, status: "denied" as const } : sub)
    );
  };

  const totalMonthly = subscriptions
    .filter(sub => sub.status === "active")
    .reduce((sum, sub) => sum + sub.amount, 0);

  const pendingCharges = subscriptions.filter(sub => sub.status === "pending").length;

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
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/")}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Spend</p>
                  <p className="text-2xl font-bold text-card-foreground">${totalMonthly.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-warning/10 to-warning/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold text-card-foreground">{pendingCharges}</p>
                </div>
                <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {subscriptions.filter(sub => sub.status === "active").length}
                  </p>
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
              <PlaidLink onSuccess={() => setShowPlaidLink(false)} />
            </CardContent>
          </Card>
        )}

        {/* Account Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TransactionList />
          
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <h2 className="text-xl font-semibold">Bank Accounts</h2>
              <p className="text-sm text-muted-foreground">
                Your connected accounts and balances
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Banknote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground"><BankAccountsCard />
</p>
                <p className="text-sm text-muted-foreground mt-2">
                  <BankAccountsCard />
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <h2 className="text-xl font-semibold text-card-foreground">Your Subscriptions</h2>
            <p className="text-sm text-muted-foreground">
              Manage your recurring charges and approve upcoming payments
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="p-6 hover:bg-accent/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-card-foreground">{subscription.merchant}</h3>
                        <Badge 
                          variant={
                            subscription.status === "active" ? "active" :
                            subscription.status === "pending" ? "pending" : "denied"
                          }
                        >
                          {subscription.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>${subscription.amount} / {subscription.frequency}</span>
                        <span>•</span>
                        <span>Next: {subscription.nextCharge}</span>
                        <span>•</span>
                        <span>{subscription.category}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/subscription/${subscription.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {subscription.status === "pending" && (
                        <>
                          <Button
                            variant="approve"
                            size="sm"
                            onClick={() => handleApprove(subscription.id)}
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            variant="deny"
                            size="sm"
                            onClick={() => handleDeny(subscription.id)}
                          >
                            <X className="w-4 h-4" />
                            Deny
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
