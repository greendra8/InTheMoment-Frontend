// $lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const options = {
  auth: {
    autoRefreshToken: true,
  },
};

export const supabase = createClient<Database>(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  options
);