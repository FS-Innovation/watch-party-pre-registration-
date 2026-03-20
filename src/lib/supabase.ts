import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Anon client — used by client-side code only
let _supabase: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        throw new Error(
          "Supabase URL and anon key must be set in environment variables"
        );
      }
      _supabase = createClient(url, key);
    }
    return Reflect.get(_supabase, prop);
  },
});

// Service client — used by API routes (server-side only)
// Bypasses RLS, should never be exposed to the client
let _serviceClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  // Fall back to anon key if service key isn't set (dev mode)
  if (!serviceKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not set — falling back to anon key");
    return supabase;
  }

  _serviceClient = createClient(url, serviceKey);
  return _serviceClient;
}

// Helper for API routes — prefer service client
export const db = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getServiceClient(), prop);
  },
});
