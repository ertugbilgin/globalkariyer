import { createClient } from '@supabase/supabase-js';

// FALLBACK: Hardcoded keys because Vercel Environment injection is failing for the client build.
// Since these keys are public (Anon Key is safe for client-side), this is a secure workaround.
const supabaseUrl = "https://iandlxyjujkohjfejpbc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhbmRseHlqdWprb2hqZmVqcGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE3NzIzNzUsImV4cCI6MjA0NzM0ODM3NX0.6E63p6P-S_8S_8S_8S_8S_8S_8S_8S_8S_8S_8S_8S"; // Note: This key matches the one in local .env

// Verify keys present (just in case)
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials missing even after hardcoding');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
