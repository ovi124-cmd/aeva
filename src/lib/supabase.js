import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kanddhyqnccadwzmomof.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6-8UkojZEbyiRK7RYgWRPg_SGHC4d-N';

export const isSupabaseConfigured = () => {
  return (
    Boolean(SUPABASE_URL) &&
    !SUPABASE_URL.includes('YOUR_SUPABASE_URL_HERE') &&
    Boolean(SUPABASE_ANON_KEY) &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE'
  );
};

export const supabase = createClient(
  SUPABASE_URL.startsWith('http') ? SUPABASE_URL : 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);

/**
 * Checks if an error is due to an expired or invalid JWT.
 * Attempts to refresh the session, or signs out to clear stale localStorage tokens
 * so subsequent requests can succeed anonymously or prompt re-login.
 */
export async function handleJwtExpiration(error) {
  if (
    error &&
    (error.message?.includes('JWT expired') ||
      error.code === 'PGRST301' ||
      error.status === 401 ||
      (typeof error === 'string' && error.includes('JWT expired')))
  ) {
    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !data?.session) {
        // If refresh fails, clear stale session so unauthenticated/anon queries can succeed
        await supabase.auth.signOut().catch(() => {});
        return true;
      }
      return true;
    } catch {
      await supabase.auth.signOut().catch(() => {});
      return true;
    }
  }
  return false;
}

/**
 * Resilient fetch for active templates from Supabase.
 * Handles JWT expiration automatically and retries gracefully.
 */
export async function fetchActiveTemplates() {
  try {
    let { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error && (await handleJwtExpiration(error))) {
      const retry = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      data = retry.data;
      error = retry.error;
    }

    return { data: data || [], error };
  } catch (err) {
    return { data: [], error: err };
  }
}

// Proactively inspect and refresh stale session on startup in the browser
if (typeof window !== 'undefined') {
  try {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error && (error.message?.includes('JWT expired') || error.status === 401)) {
        await supabase.auth.signOut().catch(() => {});
      } else if (session?.expires_at && session.expires_at * 1000 < Date.now()) {
        const { error: refreshError } = await supabase.auth.refreshSession().catch((e) => ({ error: e }));
        if (refreshError) {
          await supabase.auth.signOut().catch(() => {});
        }
      }
    }).catch(() => {});
  } catch {}
}
