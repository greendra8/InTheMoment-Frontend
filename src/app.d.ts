import type { Session, User } from '@supabase/supabase-js'

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      isNativeApp: boolean;
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
      session: Session | null;
      user: User | null;
    }
    interface PageData {
      session: Session | null
    }
    // interface PageState {}
    // interface Platform {}
  }
}

declare global {
  interface Window {
    isNativeApp?: boolean;
    sendToReactNative?: (message: { type: string; data: any }) => void;
    sendToReactNativeMessage?: (type: string, data: any) => void;
  }
}

export {}