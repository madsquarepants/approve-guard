import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { usePlaid } from '@/hooks/usePlaid';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  merchant_name: string;
  category: string[];
  date: string;
  pending: boolean;
}

export const TransactionList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { syncTransactions } = usePlaid();

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTransactions = async () => {
    try {
      setLoading(true);
      await syncTransactions();
      await fetchTransactions();
      toast.success('Transactions synced successfully');
    } catch (error) {
      toast.error('Failed to sync transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading && transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button
          onClick={handleSyncTransactions}
          disabled={loading}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Sync
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Connect a bank account and sync transactions to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">
                      {transaction.merchant_name || transaction.description}
                    </h4>
                    {transaction.pending && (
                      <Badge variant="pending" className="text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                  {transaction.description !== transaction.merchant_name && (
                    <p className="text-sm text-muted-foreground">
                      {transaction.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(transaction.date)}
                    </span>
                    {transaction.category?.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {transaction.category[0]}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    transaction.amount > 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {transaction.amount > 0 ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};