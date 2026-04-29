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
  | 'new'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'driver_assigned'
  | 'at_restaurant'
  | 'customer_arrived'
  | 'shipped'
  | 'completed'
  | 'cancelled'

export type OrderSource = 'pos' | 'mobile_app' | 'customer_app'
export type OrderType = 'delivery' | 'pickup' | 'drive_thru'
export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'delivered'

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
  restaurant_id?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  status: OrderStatus
  order_source: OrderSource
  payment_method?: PaymentMethod
  customer_name?: string
  customer_phone?: string
  notes?: string
  order_type?: OrderType
  delivery_status?: DeliveryStatus
  accepted_by?: string
  reject_reason?: string
  car_plate_number?: string
  car_color?: string
  driver_id?: string
  ready_at?: string
  driver_accepted_at?: string
  arrived_at_store_at?: string
  shipped_at?: string
  delivered_at?: string
  created_at: string
  updated_at: string
}
