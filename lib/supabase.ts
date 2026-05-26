import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (use in "use client" components)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role (server-only, never expose to browser)
export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          credits: number;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          credits?: number;
          created_at?: string;
        };
        Update: {
          credits?: number;
        };
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          input_image_url: string;
          output_image_url: string;
          style: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          input_image_url: string;
          output_image_url: string;
          style: string;
          created_at?: string;
        };
        Update: never;
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: "purchase" | "use" | "bonus";
          pack_id: string | null;
          stripe_session_id: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          type: "purchase" | "use" | "bonus";
          pack_id?: string;
          stripe_session_id?: string;
        };
        Update: never;
      };
    };
  };
};
