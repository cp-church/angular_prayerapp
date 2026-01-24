// Copy this file to environment.ts and fill in your Supabase credentials
// DO NOT commit environment.ts to version control

export const environment = {
  production: false,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
  clarityProjectId: import.meta.env.VITE_CLARITY_PROJECT_ID || ''
};
