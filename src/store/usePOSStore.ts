import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { supabase, type Order, type OrderItem, type PaymentMethod } from '@/lib/supabase'

export interface CartItem extends OrderItem {
  subtotal: number
}

export interface POSStore {
  // سلة الشراء
  cart: CartItem[]
  addToCart: (item: Omit<OrderItem, 'quantity'>) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void

  // حساب الإجماليات
  subtotal: number
  tax: number
  total: number

  // الطلبات الخارجية (من تطبيق العميل)
  onlineOrders: Order[]
  setOnlineOrders: (orders: Order[]) => void
  addOnlineOrder: (order: Order) => void
  updateOnlineOrder: (id: string, updates: Partial<Order>) => Promise<void>

  // حالة الإشعارات
  pendingCount: number

  // حالة الاتصال
  isConnected: boolean
  setConnected: (status: boolean) => void

  // Modal الدفع
  isPaymentModalOpen: boolean
  openPaymentModal: () => void
  closePaymentModal: () => void

  // إتمام الطلب
  isProcessing: boolean
  checkoutOrder: (paymentMethod: PaymentMethod) => Promise<{ success: boolean; orderId?: string }>

  // الفلتر النشط
  activeCategory: string
  setActiveCategory: (category: string) => void
}

const TAX_RATE = 0.15

function computeTotals(cart: CartItem[]) {
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax
  return { subtotal, tax, total }
}

export const usePOSStore = create<POSStore>((set, get) => ({
  // --- Cart ---
  cart: [],

  addToCart: (item) => {
    set((state) => {
      const existing = state.cart.find((c) => c.id === item.id)
      let newCart: CartItem[]

      if (existing) {
        newCart = state.cart.map((c) =>
          c.id === item.id
            ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * c.price }
            : c
        )
      } else {
        newCart = [
          ...state.cart,
          { ...item, quantity: 1, subtotal: item.price },
        ]
      }

      return { cart: newCart, ...computeTotals(newCart) }
    })
  },

  removeFromCart: (id) => {
    set((state) => {
      const newCart = state.cart.filter((c) => c.id !== id)
      return { cart: newCart, ...computeTotals(newCart) }
    })
  },

  updateQuantity: (id, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        const newCart = state.cart.filter((c) => c.id !== id)
        return { cart: newCart, ...computeTotals(newCart) }
      }
      const newCart = state.cart.map((c) =>
        c.id === id ? { ...c, quantity, subtotal: quantity * c.price } : c
      )
      return { cart: newCart, ...computeTotals(newCart) }
    })
  },

  clearCart: () => set({ cart: [], subtotal: 0, tax: 0, total: 0 }),

  // --- Totals (initial) ---
  subtotal: 0,
  tax: 0,
  total: 0,

  // --- Online Orders ---
  onlineOrders: [],
  pendingCount: 0,

  setOnlineOrders: (orders) => {
    const pending = orders.filter((o) => o.status === 'new').length
    set({ onlineOrders: orders, pendingCount: pending })
  },

  addOnlineOrder: (order) => {
    set((state) => {
      const exists = state.onlineOrders.find((o) => o.id === order.id)
      if (exists) return {}
      const newOrders = [order, ...state.onlineOrders]
      const pending = newOrders.filter((o) => o.status === 'new').length
      return { onlineOrders: newOrders, pendingCount: pending }
    })
  },

  updateOnlineOrder: async (id, updates) => {
    const { error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      set((state) => {
        const newOrders = state.onlineOrders.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        )
        const pending = newOrders.filter((o) => o.status === 'new').length
        return { onlineOrders: newOrders, pendingCount: pending }
      })
    }
  },

  // --- Connection ---
  isConnected: false,
  setConnected: (status) => set({ isConnected: status }),

  // --- Payment Modal ---
  isPaymentModalOpen: false,
  openPaymentModal: () => set({ isPaymentModalOpen: true }),
  closePaymentModal: () => set({ isPaymentModalOpen: false }),

  // --- Checkout ---
  isProcessing: false,

  checkoutOrder: async (paymentMethod) => {
    const { cart, subtotal, tax, total, clearCart, closePaymentModal } = get()
    if (cart.length === 0) return { success: false }

    set({ isProcessing: true })

    const orderNumber = `POS-${Date.now()}`
    const newOrder = {
      order_number: orderNumber,
      items: cart,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      status: 'completed',
      order_source: 'pos',
      payment_method: paymentMethod,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('orders').insert(newOrder).select().single()

    set({ isProcessing: false })

    if (error) {
      console.error('Checkout error:', error)
      return { success: false }
    }

    clearCart()
    closePaymentModal()
    return { success: true, orderId: data?.id }
  },

  // --- Category Filter ---
  activeCategory: 'all',
  setActiveCategory: (category) => set({ activeCategory: category }),
}))

// --- Shallow selectors (تمنع infinite render loop) ---

export const useCart = () =>
  usePOSStore(useShallow((s) => ({ cart: s.cart, subtotal: s.subtotal, tax: s.tax, total: s.total })))

export const useOnlineOrders = () =>
  usePOSStore(useShallow((s) => ({ onlineOrders: s.onlineOrders, pendingCount: s.pendingCount })))

export const useCartActions = () =>
  usePOSStore(
    useShallow((s) => ({
      addToCart: s.addToCart,
      removeFromCart: s.removeFromCart,
      updateQuantity: s.updateQuantity,
      clearCart: s.clearCart,
    }))
  )
