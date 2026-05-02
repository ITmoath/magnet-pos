'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Wifi, WifiOff, CheckCircle2, XCircle, ChefHat, PackageCheck, Bike } from 'lucide-react'
import { supabase, type Order } from '@/lib/supabase'
import {
  CUSTOMER_APP_ORDER_SOURCES,
  getPosRestaurantId,
  isCustomerAppOrderSource,
} from '@/lib/ordersConfig'
import { usePOSStore, useOnlineOrders } from '@/store/usePOSStore'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'قيد الانتظار',  color: 'bg-amber-100 text-amber-700 border-amber-200',    icon: <Bell size={13} /> },
  accepted:   { label: 'مقبول',         color: 'bg-blue-100 text-blue-700 border-blue-200',         icon: <CheckCircle2 size={13} /> },
  rejected:   { label: 'مرفوض',         color: 'bg-red-100 text-red-600 border-red-200',            icon: <XCircle size={13} /> },
  preparing:  { label: 'قيد التحضير',  color: 'bg-orange-100 text-orange-700 border-orange-200',   icon: <ChefHat size={13} /> },
  ready:      { label: 'جاهز',          color: 'bg-green-100 text-green-700 border-green-200',       icon: <PackageCheck size={13} /> },
  delivered:  { label: 'تم التسليم',    color: 'bg-teal-100 text-teal-700 border-teal-200',         icon: <Bike size={13} /> },
  completed:  { label: 'مكتمل',         color: 'bg-gray-100 text-gray-600 border-gray-200',         icon: <CheckCircle2 size={13} /> },
}

function includesRestaurant(o: Order): boolean {
  const rid = getPosRestaurantId()
  if (!rid) return true
  if (o.restaurant_id == null || o.restaurant_id === '') return true
  return o.restaurant_id === rid
}

function isTrackedOnlineCustomerOrder(o: Order): boolean {
  return isCustomerAppOrderSource(o.order_source) && includesRestaurant(o)
}

export default function OnlineOrdersNotification() {
  const { onlineOrders, pendingCount } = useOnlineOrders()
  const setOnlineOrders = usePOSStore((s) => s.setOnlineOrders)
  const addOnlineOrder = usePOSStore((s) => s.addOnlineOrder)
  const updateOnlineOrderStatus = usePOSStore((s) => s.updateOnlineOrderStatus)
  const setConnected = usePOSStore((s) => s.setConnected)
  const isConnected = usePOSStore((s) => s.isConnected)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const applyRemoteOrderRow = (row: Order) => {
    const terminal = ['completed', 'rejected'] as const
    usePOSStore.setState((state) => {
      if (!isTrackedOnlineCustomerOrder(row)) return {}
      if (terminal.includes(row.status as (typeof terminal)[number])) {
        const next = state.onlineOrders.filter((o) => o.id !== row.id)
        const pending = next.filter((o) => o.status === 'pending').length
        return { onlineOrders: next, pendingCount: pending }
      }
      const idx = state.onlineOrders.findIndex((o) => o.id === row.id)
      let next: Order[]
      if (idx >= 0) {
        next = [...state.onlineOrders]
        next[idx] = row
      } else {
        next = [row, ...state.onlineOrders]
      }
      const pending = next.filter((o) => o.status === 'pending').length
      return { onlineOrders: next, pendingCount: pending }
    })
  }

  useEffect(() => {
    console.log('Supabase Env:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Environment Key Check:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const fetchOrders = async () => {
      let q = supabase
        .from('orders')
        .select('*')
        .in('order_source', [...CUSTOMER_APP_ORDER_SOURCES])
        .not('status', 'in', '("completed","rejected")')
        .order('created_at', { ascending: false })
        .limit(50)

      const rid = getPosRestaurantId()
      if (rid) {
        q = q.or(`restaurant_id.eq.${rid},restaurant_id.is.null`)
      }

      const { data, error } = await q

      if (!error && data) {
        const filtered = (data as Order[]).filter(isTrackedOnlineCustomerOrder)
        setOnlineOrders(filtered)
      }
    }

    let isStatusResolved = false
    let realtimeTimeoutId: ReturnType<typeof setTimeout> | null = null

    const initRealtime = async () => {
      await fetchOrders()
      await supabase.removeAllChannels()

      const channel = supabase
        .channel('custom-all-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            const row = payload.new as Order
            if (row.restaurant_id !== process.env.NEXT_PUBLIC_POS_RESTAURANT_ID) return
            console.log('طلب جديد لبرجر هاوس!', row)
            if (!isTrackedOnlineCustomerOrder(row)) return
            if (row.status === 'completed' || row.status === 'rejected') return
            addOnlineOrder(row)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            applyRemoteOrderRow(payload.new as Order)
          }
        )

      channelRef.current = channel
      console.log('Attempting to subscribe...')
      realtimeTimeoutId = setTimeout(() => {
        if (!isStatusResolved) {
          console.warn('Realtime subscription is taking too long')
        }
      }, 10_000)

      channel.subscribe((status) => {
        console.log('Connection Status:', status)
        if (status === 'SUBSCRIBED' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isStatusResolved = true
          if (realtimeTimeoutId) clearTimeout(realtimeTimeoutId)
        }
        if (status === 'SUBSCRIBED') {
          setConnected(true)
          return
        }
        console.error('Subscription error:', status)
        setConnected(false)
      })
    }

    void initRealtime()

    return () => {
      if (realtimeTimeoutId) clearTimeout(realtimeTimeoutId)
      void channelRef.current?.unsubscribe()
      channelRef.current = null
      setConnected(false)
    }
  }, [])

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell size={20} className="text-[#24275D]" />
            {pendingCount > 0 && (
              <motion.span
                key={pendingCount}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -left-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#D22128] text-white text-[10px] font-bold"
              >
                {pendingCount}
              </motion.span>
            )}
          </div>
          <h2 className="font-bold text-[#24275D] text-base">الطلبات الخارجية</h2>
        </div>

        {/* Connection Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
        }`}>
          {isConnected ? (
            <>
              <Wifi size={12} />
              <span>متصل</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </>
          ) : (
            <>
              <WifiOff size={12} />
              <span>غير متصل</span>
            </>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {onlineOrders.length === 0 ? (
            <motion.div
              key="no-orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-48 gap-3 text-gray-300"
            >
              <Bell size={48} strokeWidth={1.2} />
              <p className="text-sm text-gray-400">لا توجد طلبات خارجية حالياً</p>
            </motion.div>
          ) : (
            onlineOrders.map((order) => (
              <OnlineOrderCard
                key={order.id}
                order={order}
                onAccept={() => updateOnlineOrderStatus(order.id, 'accepted')}
                onReject={() => updateOnlineOrderStatus(order.id, 'rejected')}
                onStartPreparing={() => updateOnlineOrderStatus(order.id, 'preparing')}
                onReadyForPickup={() => updateOnlineOrderStatus(order.id, 'ready')}
                onMarkDelivered={() => updateOnlineOrderStatus(order.id, 'delivered')}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function OnlineOrderCard({
  order,
  onAccept,
  onReject,
  onStartPreparing,
  onReadyForPickup,
  onMarkDelivered,
}: {
  order: Order
  onAccept: () => void
  onReject: () => void
  onStartPreparing: () => void
  onReadyForPickup: () => void
  onMarkDelivered: () => void
}) {
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const deliveredCfg = STATUS_CONFIG.delivered

  const timeAgo = (() => {
    const diff = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000)
    if (diff < 60) return `منذ ${diff} ث`
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`
    return `منذ ${Math.floor(diff / 3600)} س`
  })()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, height: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className={`rounded-2xl border p-4 space-y-3 ${
        order.status === 'pending'
          ? 'border-amber-300 bg-amber-50 shadow-md shadow-amber-100'
          : 'border-gray-100 bg-white shadow-sm'
      }`}
    >
      {/* Order Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#24275D]">#{order.order_number}</span>
          {order.customer_name && (
            <p className="text-xs text-gray-500 mt-0.5">{order.customer_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{timeAgo}</span>
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusCfg.color}`}>
            {statusCfg.icon}
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1">
        {order.items?.slice(0, 3).map((item, i) => (
          <div key={i} className="flex justify-between text-xs text-gray-600">
            <span>
              <span className="font-semibold">{item.quantity}×</span> {item.name}
            </span>
            <span>{(item.price * item.quantity).toFixed(2)} ر.س</span>
          </div>
        ))}
        {order.items?.length > 3 && (
          <p className="text-xs text-gray-400">+ {order.items.length - 3} عناصر أخرى</p>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center border-t border-gray-100 pt-2">
        <span className="text-xs text-gray-500">الإجمالي</span>
        <span className="text-sm font-bold text-[#D22128]">{order.total?.toFixed(2)} ر.س</span>
      </div>

      {/* Actions — تحديث الحالة عبر Supabase من المتجر */}
      <div className="flex flex-col gap-2">
        {order.status === 'pending' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onReject}
              className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
            >
              <XCircle size={13} />
              رفض
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="flex-1 py-2 rounded-xl bg-[#24275D] text-white text-xs font-semibold hover:bg-[#1a1e4a] transition-colors flex items-center justify-center gap-1"
            >
              <CheckCircle2 size={13} />
              قبول الطلب
            </button>
          </div>
        )}

        {order.status === 'accepted' && (
          <button
            type="button"
            onClick={onStartPreparing}
            className="w-full py-2 rounded-xl bg-[#24275D]/10 text-[#24275D] text-xs font-semibold hover:bg-[#24275D]/20 transition-colors flex items-center justify-center gap-1"
          >
            <ChefHat size={13} />
            بدء التحضير
          </button>
        )}

        {order.status === 'preparing' && (
          <button
            type="button"
            onClick={onReadyForPickup}
            className="w-full py-2 rounded-xl bg-[#24275D]/10 text-[#24275D] text-xs font-semibold hover:bg-[#24275D]/20 transition-colors flex items-center justify-center gap-1"
          >
            <PackageCheck size={13} />
            جاهز للاستلام
          </button>
        )}

        {order.status === 'ready' && (
          <button
            type="button"
            onClick={onMarkDelivered}
            className="w-full py-2 rounded-xl bg-[#24275D]/10 text-[#24275D] text-xs font-semibold hover:bg-[#24275D]/20 transition-colors flex items-center justify-center gap-1"
          >
            {deliveredCfg.icon}
            تحديث إلى: {deliveredCfg.label}
          </button>
        )}
      </div>
    </motion.div>
  )
}
