import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { supabase, type Order, type OrderItem, type PaymentMethod } from '@/lib/supabase'

export interface KitchenTicketItem {
  name: string
  quantity: number
  category: string
  ingredients: string[]
}

export interface KitchenTicket {
  id: string
  orderNumber: string
  createdAt: string
  items: KitchenTicketItem[]
}

export interface CartItem extends OrderItem {
  subtotal: number
}

export interface POSStore {
  /** عناصر سلة نقطة البيع — نفس مفهوم cartItems */
  cartItems: CartItem[]
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
  updateOnlineOrderStatus: (id: string, status: Order['status']) => Promise<void>

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
  checkoutOrder: (paymentMethod: PaymentMethod) => Promise<{ success: boolean; orderId?: string; orderNumber?: string }>

  // الفلتر النشط
  activeCategory: string
  setActiveCategory: (category: string) => void

  // شاشة المطبخ — طلبات جاهزة للتجهيز بعد إتمام الدفع
  kitchenTickets: KitchenTicket[]
  removeKitchenTicket: (id: string) => void
}

const TAX_RATE = 0.15

function computeTotals(cart: CartItem[]) {
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax
  return { subtotal, tax, total }
}

export const usePOSStore = create<POSStore>((set, get) => ({
  // --- Cart (cartItems) ---
  cartItems: [],

  addToCart: (item) => {
    set((state) => {
      const existing = state.cartItems.find((c) => c.id === item.id)
      let newCart: CartItem[]

      if (existing) {
        newCart = state.cartItems.map((c) =>
          c.id === item.id
            ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * c.price }
            : c
        )
      } else {
        newCart = [
          ...state.cartItems,
          { ...item, quantity: 1, subtotal: item.price },
        ]
      }

      return { cartItems: newCart, ...computeTotals(newCart) }
    })
  },

  removeFromCart: (id) => {
    set((state) => {
      const newCart = state.cartItems.filter((c) => c.id !== id)
      return { cartItems: newCart, ...computeTotals(newCart) }
    })
  },

  updateQuantity: (id, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        const newCart = state.cartItems.filter((c) => c.id !== id)
        return { cartItems: newCart, ...computeTotals(newCart) }
      }
      const newCart = state.cartItems.map((c) =>
        c.id === id ? { ...c, quantity, subtotal: quantity * c.price } : c
      )
      return { cartItems: newCart, ...computeTotals(newCart) }
    })
  },

  clearCart: () => set({ cartItems: [], subtotal: 0, tax: 0, total: 0 }),

  // --- Totals (initial) ---
  subtotal: 0,
  tax: 0,
  total: 0,

  // --- Online Orders ---
  onlineOrders: [],
  pendingCount: 0,

  setOnlineOrders: (orders) => {
    const pending = orders.filter((o) => o.status === 'pending').length
    set({ onlineOrders: orders, pendingCount: pending })
  },

  addOnlineOrder: (order) => {
    set((state) => {
      const exists = state.onlineOrders.find((o) => o.id === order.id)
      if (exists) return {}
      const newOrders = [order, ...state.onlineOrders]
      const pending = newOrders.filter((o) => o.status === 'pending').length
      return { onlineOrders: newOrders, pendingCount: pending }
    })
  },

  updateOnlineOrderStatus: async (id, status) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      set((state) => {
        let newOrders = state.onlineOrders.map((o) =>
          o.id === id ? { ...o, status } : o
        )
        if (status === 'completed' || status === 'rejected') {
          newOrders = newOrders.filter((o) => o.id !== id)
        }
        const pending = newOrders.filter((o) => o.status === 'pending').length
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
    const { cartItems, subtotal, tax, total, clearCart, closePaymentModal } = get()
    if (cartItems.length === 0) return { success: false }

    set({ isProcessing: true })

    try {
      const orderNumber = `POS-${Date.now()}`

      const itemsForDb = cartItems.map(({ id, name, price, quantity, category, ingredients }) => ({
        id,
        name,
        price,
        quantity,
        category,
        ...(ingredients?.length ? { ingredients } : {}),
      }))

      const row: Record<string, unknown> = {
        order_number: orderNumber,
        items: itemsForDb,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        status: 'completed' as const,
        order_source: 'pos' as const,
        payment_method: paymentMethod,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }

      const rid = process.env.NEXT_PUBLIC_POS_RESTAURANT_ID
      if (rid != null && String(rid).trim().length > 0) {
        row.restaurant_id = String(rid).trim()
      }

      const { data, error } = await supabase.from('orders').insert(row).select('id').single()

      if (error) {
        console.error('Checkout (Supabase):', error)
        return { success: false }
      }

      const ticket: KitchenTicket = {
        id: `k-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        orderNumber,
        createdAt: new Date().toISOString(),
        items: cartItems.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          category: i.category,
          ingredients: i.ingredients?.length ? i.ingredients : [],
        })),
      }

      set((state) => ({ kitchenTickets: [ticket, ...state.kitchenTickets] }))
      clearCart()
      closePaymentModal()

      return { success: true, orderNumber, orderId: data?.id as string | undefined }
    } finally {
      set({ isProcessing: false })
    }
  },

  // --- Category Filter ---
  activeCategory: 'all',
  setActiveCategory: (category) => set({ activeCategory: category }),

  kitchenTickets: [] as KitchenTicket[],
  removeKitchenTicket: (id) => {
    set((state) => ({
      kitchenTickets: state.kitchenTickets.filter((t) => t.id !== id),
    }))
  },
}))

// --- Shallow selectors (تمنع infinite render loop) ---

export const useCart = () =>
  usePOSStore(
    useShallow((s) => ({
      cart: s.cartItems,
      subtotal: s.subtotal,
      tax: s.tax,
      total: s.total,
    }))
  )

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
