import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          plan: 'free' | 'pro'
          stripe_customer_id: string | null
          status_page_slug: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          plan?: 'free' | 'pro'
          stripe_customer_id?: string | null
          status_page_slug?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          plan?: 'free' | 'pro'
          stripe_customer_id?: string | null
          status_page_slug?: string | null
          created_at?: string
        }
        Relationships: []
      }
      monitors: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          interval_minutes: number
          is_active: boolean
          last_checked_at: string | null
          last_status: 'up' | 'down' | 'unknown'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url: string
          interval_minutes?: number
          is_active?: boolean
          last_checked_at?: string | null
          last_status?: 'up' | 'down' | 'unknown'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          url?: string
          interval_minutes?: number
          is_active?: boolean
          last_checked_at?: string | null
          last_status?: 'up' | 'down' | 'unknown'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'monitors_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      monitor_checks: {
        Row: {
          id: string
          monitor_id: string
          checked_at: string
          status: 'up' | 'down'
          response_time_ms: number | null
          status_code: number | null
        }
        Insert: {
          id?: string
          monitor_id: string
          checked_at?: string
          status: 'up' | 'down'
          response_time_ms?: number | null
          status_code?: number | null
        }
        Update: {
          id?: string
          monitor_id?: string
          checked_at?: string
          status?: 'up' | 'down'
          response_time_ms?: number | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'monitor_checks_monitor_id_fkey'
            columns: ['monitor_id']
            isOneToOne: false
            referencedRelation: 'monitors'
            referencedColumns: ['id']
          }
        ]
      }
      incidents: {
        Row: {
          id: string
          monitor_id: string
          started_at: string
          resolved_at: string | null
          is_resolved: boolean
        }
        Insert: {
          id?: string
          monitor_id: string
          started_at?: string
          resolved_at?: string | null
          is_resolved?: boolean
        }
        Update: {
          id?: string
          monitor_id?: string
          started_at?: string
          resolved_at?: string | null
          is_resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'incidents_monitor_id_fkey'
            columns: ['monitor_id']
            isOneToOne: false
            referencedRelation: 'monitors'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Monitor = Database['public']['Tables']['monitors']['Row']
export type MonitorCheck = Database['public']['Tables']['monitor_checks']['Row']
export type Incident = Database['public']['Tables']['incidents']['Row']

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — mutations are ignored
          }
        },
      },
    }
  )
}

// Service role client for cron jobs and server-side operations that bypass RLS
export function createServiceSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
