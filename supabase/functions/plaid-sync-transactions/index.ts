import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, PlaidApi, PlaidEnvironments } from "https://esm.sh/plaid@11.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID')
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET')
    const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'sandbox'

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      throw new Error('Missing Plaid credentials')
    }

    // Initialize Plaid client
    const configuration = new Configuration({
      basePath: PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
          'PLAID-SECRET': PLAID_SECRET,
        },
      },
    })
    const client = new PlaidApi(configuration)

    // Get user from request
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's Plaid items
    const { data: plaidItems, error: itemsError } = await supabaseClient
      .from('plaid_items')
      .select('*')
      .eq('user_id', user.id)

    if (itemsError) {
      throw itemsError
    }

    let totalTransactions = 0

    for (const item of plaidItems) {
      try {
        // Get accounts for this item
        const { data: accounts, error: accountsError } = await supabaseClient
          .from('accounts')
          .select('*')
          .eq('plaid_item_id', item.id)

        if (accountsError) {
          console.error('Error fetching accounts:', accountsError)
          continue
        }

        // Get transactions for the last 30 days
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        const endDate = new Date()

        const transactionsResponse = await client.transactionsGet({
          access_token: item.access_token,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        })

        // Process transactions
        const transactionsToInsert = []
        
        for (const transaction of transactionsResponse.data.transactions) {
          // Find corresponding account
          const account = accounts.find(acc => acc.account_id === transaction.account_id)
          if (!account) continue

          // Check if transaction already exists
          const { data: existingTx } = await supabaseClient
            .from('transactions')
            .select('id')
            .eq('transaction_id', transaction.transaction_id)
            .single()

          if (!existingTx) {
            transactionsToInsert.push({
              user_id: user.id,
              account_id: account.id,
              transaction_id: transaction.transaction_id,
              amount: -transaction.amount, // Plaid uses negative for debits
              description: transaction.name,
              merchant_name: transaction.merchant_name,
              category: transaction.category,
              date: transaction.date,
              pending: transaction.pending,
            })
          }
        }

        // Insert new transactions
        if (transactionsToInsert.length > 0) {
          const { error: txError } = await supabaseClient
            .from('transactions')
            .insert(transactionsToInsert)

          if (txError) {
            console.error('Error inserting transactions:', txError)
          } else {
            totalTransactions += transactionsToInsert.length
          }
        }
      } catch (error) {
        console.error(`Error syncing transactions for item ${item.item_id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced_transactions: totalTransactions 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to sync transactions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})