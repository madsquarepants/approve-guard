import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';

interface Account {
  id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  current_balance: number;
  available_balance: number;
  currency_code: string;
}

interface AccountCardProps {
  account: Account;
}

export const AccountCard = ({ account }: AccountCardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.currency_code || 'USD',
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'depository':
        return 'success';
      case 'credit':
        return 'pending';
      case 'investment':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {account.account_name}
        </CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <Badge variant={getAccountTypeColor(account.account_type)}>
            {account.account_subtype || account.account_type}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Current Balance:</span>
            <span className="text-sm font-medium">
              {formatCurrency(account.current_balance)}
            </span>
          </div>
          {account.available_balance !== null && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Available:</span>
              <span className="text-sm font-medium">
                {formatCurrency(account.available_balance)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};