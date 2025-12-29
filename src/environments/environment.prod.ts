export const environment = {
  production: true,
  supabaseUrl: (process.env as Record<string, string | undefined>)['NG_APP_SUPABASE_URL'] || '',
  supabasePublishableKey: (process.env as Record<string, string | undefined>)['NG_APP_SUPABASE_PUBLISHABLE_KEY'] || ''
};

