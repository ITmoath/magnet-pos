import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const missingEnvVars: string[] = []

if (!supabaseUrl) missingEnvVars.push('NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseAnonKey) missingEnvVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if (missingEnvVars.length > 0) {
  const message = `[Supabase] Missing required environment variable(s): ${missingEnvVars.join(', ')}`
  console.error(message)
  throw new Error(message)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'completed'

export type OrderSource = 'pos' | 'mobile_app' | 'customer_app'

export type PaymentMethod = 'cash' | 'card' | 'wallet'

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  category: string
  /** مكونات الوجبة لعرضها في شاشة المطبخ */
  ingredients?: string[]
}

export interface Order {
  id: string
  order_number: string
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  status: OrderStatus
  order_source: OrderSource
  /** مطابق لمتجر Burger House عند المشاركة بين التطبيقات */
  restaurant_id?: string | null
  payment_method?: PaymentMethod
  customer_name?: string
  customer_phone?: string
  notes?: string
  created_at: string
  updated_at: string
}
