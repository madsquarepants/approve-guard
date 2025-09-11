import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, CreditCard, Building, Check, X, AlertTriangle } from "lucide-react";

// Mock subscription data - in real app would fetch from API
const mockSubscription = {
  id: "1",
  merchant: "Netflix",
  amount: 15.99,
  frequency: "Monthly",
  status: "pending" as const,
  nextCharge: "2024-01-15",
  category: "Entertainment",
  description: "Netflix Premium Plan",
  billingHistory: [
    { date: "2023-12-15", amount: 15.99, status: "paid" },
    { date: "2023-11-15", amount: 15.99, status: "paid" },
    { date: "2023-10-15", amount: 15.99, status: "paid" },
    { date: "2023-09-15", amount: 15.99, status: "denied" },
    { date: "2023-08-15", amount: 15.99, status: "paid" },
  ],
  accountInfo: {
    connectedCard: "**** 4532",
    merchant_contact: "support@netflix.com",
    billingAddress: "Los Gatos, CA"
  }
};

const SubscriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleApprove = () => {
    // Mock approve action
    console.log("Approved subscription", id);
    navigate("/dashboard");
  };

  const handleDeny = () => {
    // Mock deny action  
    console.log("Denied subscription", id);
    navigate("/dashboard");
  };

  const handleCancelSubscription = () => {
    // Mock cancellation flow
    console.log("Starting cancellation for", id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-card-foreground">Subscription Details</h1>
              <p className="text-sm text-muted-foreground">Manage your {mockSubscription.merchant} subscription</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-card-foreground">{mockSubscription.merchant}</h2>
                      <p className="text-muted-foreground">{mockSubscription.description}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      mockSubscription.status === "pending" ? "pending" : "active"
                    }
                  >
                    {mockSubscription.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">${mockSubscription.amount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Frequency</p>
                      <p className="font-medium">{mockSubscription.frequency}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center">
                      <Building className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium">{mockSubscription.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Charge</p>
                      <p className="font-medium">{mockSubscription.nextCharge}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <h3 className="text-lg font-semibold text-card-foreground">Billing History</h3>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {mockSubscription.billingHistory.map((charge, index) => (
                    <div key={index} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          charge.status === "paid" ? "bg-success" : "bg-destructive"
                        }`} />
                        <span className="text-sm text-muted-foreground">{charge.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">${charge.amount}</span>
                        <Badge variant={charge.status === "paid" ? "active" : "denied"} className="text-xs">
                          {charge.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {mockSubscription.status === "pending" && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-warning/5 to-warning/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <h3 className="font-medium text-card-foreground">Pending Approval</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This charge requires your approval before processing
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="approve" 
                    className="w-full"
                    onClick={handleApprove}
                  >
                    <Check className="w-4 h-4" />
                    Approve Charge
                  </Button>
                  <Button 
                    variant="deny" 
                    className="w-full"
                    onClick={handleDeny}
                  >
                    <X className="w-4 h-4" />
                    Deny & Cancel
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <h3 className="font-medium text-card-foreground">Account Information</h3>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Connected Card</p>
                  <p className="font-medium">{mockSubscription.accountInfo.connectedCard}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Merchant Contact</p>
                  <p className="font-medium">{mockSubscription.accountInfo.merchant_contact}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Billing Address</p>
                  <p className="font-medium">{mockSubscription.accountInfo.billingAddress}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg border-destructive/20 bg-destructive/5">
              <CardHeader>
                <h3 className="font-medium text-card-foreground">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  Cancel this subscription permanently
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleCancelSubscription}
                >
                  Cancel Subscription
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetail;