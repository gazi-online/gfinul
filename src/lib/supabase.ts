import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper types derived from the schema
export type DatabaseUser = {
  id: string
  name: string
  email: string
  phone?: string
  created_at: string
}

export type DatabaseProduct = {
  id: string
  name: string
  price: number
  image?: string
  category: string
  created_at: string
}

export type DatabaseService = {
  id: string
  name: string
  description?: string
  created_at: string
}
