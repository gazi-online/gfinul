import { type User } from '@supabase/supabase-js'
import { type LucideIcon } from 'lucide-react'

export interface Product {
  id: string
  name: string
  price: number
  image: string
  images?: string[] | null
  image_labels?: string[] | null
  category: string
  description?: string | null
  rating?: number | null
  review_count?: number | null
  stock?: number
  warranty_months?: number | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface ServiceItem {
  id: string
  name: string
  description: string
  icon?: LucideIcon
  is_active?: boolean
  created_at?: string
  badge?: string
  badgeBg?: string
  badgeColor?: string
  actionLabel?: string
}

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

export interface Order {
  id: string
  user_id: string
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'delivered' | 'cancelled'
  created_at: string
}

export interface AppUser {
  id: string
  name: string
  email: string
  phone?: string | null
  is_admin?: boolean
  is_blocked?: boolean
  role?: string | null
  created_at: string
  updated_at?: string
}

export interface ServiceRequest {
  id: string
  user_id: string
  service_id: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  form_data?: any
  document_urls?: string[]
  created_at: string
  guest?: boolean
  services?: {
    name: string
  }
  users?: {
    name: string
    email: string
    phone?: string | null
  }
}

export interface CustomerReview {
  id: string
  name: string
  rating: number
  comment: string
  avatar?: string | null
  created_at: string
}

export type WarrantyStatus = 'active' | 'expired'

export interface Warranty {
  id: string
  user_id: string
  product_id: string
  order_id: string
  warranty_start_date: string
  warranty_end_date: string
  status: WarrantyStatus
  created_at: string
  products?: {
    name: string
    image: string | null
    category: string
  } | null
}
