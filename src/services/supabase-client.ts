// src/services/supabase-client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import { isMobile } from '../utils/platform';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface SupabaseStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// Async storage backed by Capacitor Preferences (for iOS/Android)
const preferencesStorage: SupabaseStorageAdapter = {
  async getItem(key: string) {
    const { value } = await Preferences.get({ key });
    if (value === undefined || value === null) {
      return null;
    } else {
      return value;
    }
  },
  async setItem(key: string, value: string) {
    await Preferences.set({ key, value });
  },
  async removeItem(key: string) {
    await Preferences.remove({ key });
  },
};

// Create the client. On native, pass the Capacitor storage; on web, let Supabase use localStorage.
let supabase: SupabaseClient;

if (isMobile()) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: preferencesStorage,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });
}

export { supabase };
