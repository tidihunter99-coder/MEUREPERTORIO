import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function createSupabaseBrowserClient() {
  if (!url || !publishableKey) return null;
  return createBrowserClient(url, publishableKey);
}
