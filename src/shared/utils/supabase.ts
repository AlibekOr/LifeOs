import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { RNCLI_SUPABASE_URL, RNCLI_SUPABASE_PUBLISHABLE_KEY } from '@env';

export const supabase = createClient(
  RNCLI_SUPABASE_URL,
  RNCLI_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
