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

    // Create link token
    const linkTokenRequest = {
      user: {
        client_user_id: user.id,
      },
      client_name: 'ApproveGuard',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    }

    const response = await client.linkTokenCreate(linkTokenRequest)
    
    return new Response(
      JSON.stringify({ link_token: response.data.link_token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating link token:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create link token' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})