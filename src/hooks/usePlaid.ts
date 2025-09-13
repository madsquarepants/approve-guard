import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export const usePlaid = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLinkToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('plaid-link-token', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data.link_token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create link token';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exchangePublicToken = async (publicToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('plaid-exchange-token', {
        body: { public_token: publicToken },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to exchange token';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const syncTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('plaid-sync-transactions', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync transactions';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createLinkToken,
    exchangePublicToken,
    syncTransactions,
    loading,
    error,
  };
};