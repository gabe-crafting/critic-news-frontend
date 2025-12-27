# Tweeter only for news

## Environment Setup

The environment files are already created but need to be filled with your Supabase credentials:

1. Update `src/environments/environment.ts` with your development Supabase credentials:
   - `supabaseUrl`: Your Supabase project URL
   - `supabasePublishableKey`: Your Supabase Publishable key (safe for frontend use)

2. Update `src/environments/environment.prod.ts` with your production Supabase credentials.

**Important**: 
- The actual environment files (`environment.ts` and `environment.prod.ts`) are **ignored by git** and will **not** be committed to the repository
- Only the example files (`environment.example.ts` and `environment.prod.example.ts`) are committed as templates
- This ensures your sensitive keys stay local and secure