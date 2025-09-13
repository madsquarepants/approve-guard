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
    const { public_token } = await req.json()

    if (!public_token) {
      throw new Error('Missing public_token')
    }

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

    // Exchange public token for access token
    const exchangeResponse = await client.itemPublicTokenExchange({
      public_token,
    })

    const { access_token, item_id } = exchangeResponse.data

    // Get item and institution info
    const itemResponse = await client.itemGet({ access_token })
    const institutionResponse = await client.institutionsGetById({
      institution_id: itemResponse.data.item.institution_id!,
      country_codes: ['US'],
    })

    // Store item in database
    const { data: plaidItem, error: itemError } = await supabaseClient
      .from('plaid_items')
      .insert({
        user_id: user.id,
        item_id,
        access_token,
        institution_id: itemResponse.data.item.institution_id,
        institution_name: institutionResponse.data.institution.name,
      })
      .select()
      .single()

    if (itemError) {
      throw itemError
    }

    // Get accounts
    const accountsResponse = await client.accountsGet({ access_token })
    
    // Store accounts in database
    const accountsToInsert = accountsResponse.data.accounts.map(account => ({
      user_id: user.id,
      plaid_item_id: plaidItem.id,
      account_id: account.account_id,
      account_name: account.name,
      account_type: account.type,
      account_subtype: account.subtype,
      current_balance: account.balances.current,
      available_balance: account.balances.available,
      currency_code: account.balances.iso_currency_code || 'USD',
    }))

    const { error: accountsError } = await supabaseClient
      .from('accounts')
      .insert(accountsToInsert)

    if (accountsError) {
      throw accountsError
    }

    return new Response(
      JSON.stringify({ success: true, item_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error exchanging token:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to exchange token' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})