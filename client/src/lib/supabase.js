import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// STRICT DEBUGGING: Log exactly what Vite sees during build/runtime
console.log('🔌 Supabase Init Debug:', {
    url_exists: !!supabaseUrl,
    url_val: supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'undefined',
    key_exists: !!supabaseAnonKey,
    mode: import.meta.env.MODE
});

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase URL or Anon Key missing in environment variables');
    // Prevent crash during debug phase if feasible, or let it crash after logging
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
