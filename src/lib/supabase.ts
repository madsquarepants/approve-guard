// src/lib/supabaseClient.ts
// Minimal no-op shim so code that calls supabase.auth doesn't crash.
// Remove this later when you have real auth.
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} }}}),
    signInWithOAuth: async (_opts: any) => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
  },
};
export default supabase;
