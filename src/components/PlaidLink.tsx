import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePlaid } from '@/hooks/usePlaid';
import { toast } from 'sonner';

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
        console.error('Failed to initialize Plaid:', err);
        toast.error('Failed to initialize bank connection');
      }
    };

    initializePlaid();
  }, [createLinkToken]);

  const handlePlaidLink = async () => {
    if (!linkToken) {
      toast.error('Link token not ready');
      return;
    }

    try {
      // In a real implementation, you would use Plaid Link SDK here
      // For now, we'll simulate the flow
      toast.info('Opening Plaid Link...');
      
      // This would be replaced with actual Plaid Link integration
      // const handler = Plaid.create({
      //   token: linkToken,
      //   onSuccess: async (public_token, metadata) => {
      //     await exchangePublicToken(public_token);
      //     onSuccess?.();
      //   },
      //   onExit: (err, metadata) => {
      //     if (err) {
      //       toast.error('Failed to connect bank account');
      //     }
      //   },
      // });
      // handler.open();
      
      // Temporary mock for demonstration
      setTimeout(async () => {
        try {
          // This would be the actual public token from Plaid
          const mockPublicToken = 'public-sandbox-' + Math.random().toString(36).substr(2, 9);
          await exchangePublicToken(mockPublicToken);
          toast.success('Bank account connected successfully!');
          onSuccess?.();
        } catch (err) {
          toast.error('Failed to connect bank account');
        }
      }, 2000);
      
    } catch (err) {
      toast.error('Failed to open Plaid Link');
    }
  };

  if (error) {
    return (
      <div className="text-center">
        <p className="text-destructive mb-4">Error: {error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold mb-4">Connect Your Bank Account</h3>
      <p className="text-muted-foreground mb-6">
        Securely connect your bank account to start monitoring transactions and managing approvals.
      </p>
      <Button 
        onClick={handlePlaidLink}
        disabled={loading || !linkToken}
        size="lg"
      >
        {loading ? 'Loading...' : 'Connect Bank Account'}
      </Button>
    </div>
  );
};