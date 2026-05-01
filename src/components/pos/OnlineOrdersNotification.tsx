'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Wifi, WifiOff, CheckCircle2, XCircle, ChefHat, PackageCheck, Bike, MapPin, UserCheck, Truck, Handshake } from 'lucide-react'
import { supabase, type Order, type OrderStatus } from '@/lib/supabase'
import { usePOSStore, useOnlineOrders } from '@/store/usePOSStore'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new:               { label: 'طلب جديد',           color: 'bg-amber-100 text-amber-700 border-amber-200',    icon: <Bell size={13} /> },
  accepted:          { label: 'مقبول',               color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: <CheckCircle2 size={13} /> },
  preparing:         { label: 'قيد التحضير',         color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <ChefHat size={13} /> },
  ready:             { label: 'جاهز',                color: 'bg-green-100 text-green-700 border-green-200',    icon: <PackageCheck size={13} /> },
  driver_assigned:   { label: 'مندوب معيّن',         color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Bike size={13} /> },
  at_restaurant:     { label: 'المندوب في المطعم',   color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: <MapPin size={13} /> },
  handed_to_driver:  { label: 'سُلّم للمندوب',       color: 'bg-violet-100 text-violet-700 border-violet-200', icon: <Handshake size={13} /> },
  customer_arrived:  { label: 'العميل وصل',          color: 'bg-teal-100 text-teal-700 border-teal-200',       icon: <UserCheck size={13} /> },
  shipped:           { label: 'في الطريق',            color: 'bg-cyan-100 text-cyan-700 border-cyan-200',       icon: <Truck size={13} /> },
  completed:         { label: 'مكتمل',               color: 'bg-gray-100 text-gray-600 border-gray-200',        icon: <CheckCircle2 size={13} /> },
  cancelled:         { label: 'ملغي',                color: 'bg-red-100 text-red-600 border-red-200',           icon: <XCircle size={13} /> },
}

export default function OnlineOrdersNotification() {
  const { onlineOrders, pendingCount } = useOnlineOrders()
  const setOnlineOrders = usePOSStore((s) => s.setOnlineOrders)
  const addOnlineOrder = usePOSStore((s) => s.addOnlineOrder)
  const setConnected = usePOSStore((s) => s.setConnected)
  const isConnected = usePOSStore((s) => s.isConnected)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live')
  const restaurantId = process.env.NEXT_PUBLIC_POS_RESTAURANT_ID

  const getTimestampForStatus = (status: OrderStatus): Record<string, string> => {
    const now = new Date().toISOString()
    switch (status) {
      case 'ready':            return { ready_at: now }
      case 'driver_assigned':  return { driver_accepted_at: now }
      case 'at_restaurant':    return { arrived_at_store_at: now }
      case 'handed_to_driver': return { handed_to_driver_at: now }
      case 'shipped':          return { shipped_at: now }
      case 'completed':        return { delivered_at: now }
      default:                 return {}
    }
  }

  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    options?: { rejectReason?: string }
  ) => {
    // منع التحديث المتكرر إذا كان الطلب يُحدَّث بالفعل
    if (updatingOrderIds.has(orderId)) return false

    setUpdatingOrderIds((prev) => new Set(prev).add(orderId))

    const timestamps = getTimestampForStatus(newStatus)

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, ...timestamps })
      .eq('id', orderId)

    setUpdatingOrderIds((prev) => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })

    if (error) {
      console.error('FAILED TO UPDATE SUPABASE:', error.message)
      alert('فشل تحديث الحالة في السيرفر: ' + error.message)
      return false
    }

    // لا يوجد تحديث محلي متفائل هنا — Realtime هو المصدر الوحيد للحقيقة.
    // الـ subscription أدناه سيحدّث الـ store عند ورود حدث UPDATE من Supabase.
    return true
  }

  const activeOrders = useMemo(
    () =>
      onlineOrders.filter(
        (order) => order.status !== 'completed' && order.status !== 'cancelled'
      ) as Order[],
    [onlineOrders]
  )

  const historyOrders = useMemo(
    () =>
      onlineOrders.filter(
        (order) => order.status === 'completed' || order.status === 'cancelled'
      ) as Order[],
    [onlineOrders]
  )

  const selectedOrder = useMemo(
    () => onlineOrders.find((order) => order.id === selectedOrderId) ?? null,
    [onlineOrders, selectedOrderId]
  )

  // إغلاق الـ sheet تلقائياً إذا اختفى الطلب من الـ store بالكامل
  useEffect(() => {
    if (selectedOrderId && !onlineOrders.find((o) => o.id === selectedOrderId)) {
      setSelectedOrderId(null)
    }
  }, [onlineOrders, selectedOrderId])

  useEffect(() => {
    console.log('Supabase Env:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    if (!restaurantId) {
      setConnected(false)
      setOnlineOrders([])
      return
    }

    const isTargetExternalOrder = (order: Partial<Order>) =>
      order.restaurant_id === restaurantId && order.order_source === 'customer_app'

    // جلب الطلبات الأونلاين الحالية + سجل اليوم
    const fetchOrders = async () => {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [activeResult, historyResult] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('order_source', 'customer_app')
          .not('status', 'in', '("completed","cancelled")')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('order_source', 'customer_app')
          .in('status', ['completed', 'cancelled'])
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false })
          .limit(30),
      ])

      const merged = [
        ...((activeResult.data as Order[]) ?? []),
        ...((historyResult.data as Order[]) ?? []),
      ]
      if (merged.length > 0) setOnlineOrders(merged)
    }

    fetchOrders()

    // Realtime subscription
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('New Order Received!', payload)
          // هنا كود تحديث القائمة والإشعار الصوتي
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order
            if (!isTargetExternalOrder(newOrder)) return
            addOnlineOrder(newOrder)
            return
          }

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order
            if (!isTargetExternalOrder(updated)) return
            // تحديث atomic لتجنب race condition عند قراءة getState() مرتين
            usePOSStore.setState((state) => {
              const newOrders = state.onlineOrders.map((o) =>
                o.id === updated.id ? updated : o
              )
              return {
                onlineOrders: newOrders,
                pendingCount: newOrders.filter((o) => o.status === 'new').length,
              }
            })
          }
        }
      )
      .subscribe(async (status) => {
        console.log('Realtime Status Updated:', status)
        if (status === 'SUBSCRIBED') {
          setConnected(true)
          return
        }
        setConnected(false)
        if (status === 'CHANNEL_ERROR') {
          console.warn(
            'Realtime channel error. تحقق من RLS: يجب السماح لـ anon/select على public.orders ليستقبل postgres_changes.'
          )
        }
      })

    return () => {
      supabase.removeChannel(channel)
      setConnected(false)
    }
  }, [restaurantId, setOnlineOrders, addOnlineOrder, setConnected])

  return (
    <div className="relative flex flex-col h-full" dir="rtl">
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

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-4 pt-3 gap-1">
        <button
          onClick={() => setActiveTab('live')}
          className={`relative flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
            activeTab === 'live'
              ? 'bg-white border border-b-white border-gray-100 text-[#24275D]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          الطلبات الحية
          {activeOrders.length > 0 && (
            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-[#D22128] text-white text-[9px] font-bold">
              {activeOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
            activeTab === 'history'
              ? 'bg-white border border-b-white border-gray-100 text-[#24275D]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          الطلبات السابقة
          {historyOrders.length > 0 && (
            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-300 text-gray-700 text-[9px] font-bold">
              {historyOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 'live' ? (
            activeOrders.length === 0 ? (
              <motion.div
                key="no-live-orders"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-48 gap-3 text-gray-300"
              >
                <Bell size={48} strokeWidth={1.2} />
                <p className="text-sm text-gray-400">لا توجد طلبات نشطة حالياً</p>
              </motion.div>
            ) : (
              <motion.div key="live-list" className="space-y-3">
                <AnimatePresence initial={false}>
                  {activeOrders.map((order) => (
                    <OnlineOrderCard
                      key={order.id}
                      order={order}
                      isSelected={selectedOrderId === order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )
          ) : historyOrders.length === 0 ? (
            <motion.div
              key="no-history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-48 gap-3 text-gray-300"
            >
              <CheckCircle2 size={48} strokeWidth={1.2} />
              <p className="text-sm text-gray-400">لا توجد طلبات سابقة اليوم</p>
            </motion.div>
          ) : (
            <motion.div key="history-list" className="space-y-3">
              <AnimatePresence initial={false}>
                {historyOrders.map((order) => (
                  <OnlineOrderCard
                    key={order.id}
                    order={order}
                    isSelected={selectedOrderId === order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <OnlineOrderDetailsSheet
        order={selectedOrder}
        isUpdating={selectedOrder ? updatingOrderIds.has(selectedOrder.id) : false}
        onClose={() => setSelectedOrderId(null)}
        onAccept={async (orderId) => {
          const updated = await updateOrderStatus(orderId, 'accepted')
          if (updated) setSelectedOrderId(null)
        }}
        onCancel={async (orderId) => {
          const reason = window.prompt('سبب إلغاء الطلب:')
          if (!reason || !reason.trim()) return
          const updated = await updateOrderStatus(orderId, 'cancelled', { rejectReason: reason.trim() })
          if (updated) setSelectedOrderId(null)
        }}
        onUpdateStatus={async (orderId, status) => {
          const updated = await updateOrderStatus(orderId, status)
          if (updated) setSelectedOrderId(null)
        }}
      />
    </div>
  )
}

function OnlineOrderCard({
  order,
  onClick,
  isSelected,
}: {
  order: Order
  onClick: () => void
  isSelected: boolean
}) {
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new

  const orderTime = new Date(order.created_at).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, height: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      onClick={onClick}
      className={`rounded-2xl border p-4 space-y-3 cursor-pointer transition-all ${
        isSelected
          ? 'border-[#24275D] bg-[#24275D]/5 shadow-md shadow-[#24275D]/10'
          : order.status === 'new'
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
          {order.customer_phone && (
            <p className="text-xs text-gray-500">{order.customer_phone}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{orderTime}</span>
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusCfg.color}`}>
            {statusCfg.icon}
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1">
        {order.order_type === 'drive_thru' && (
          <div className="rounded-lg border-2 border-[#D22128] bg-red-50 px-3 py-2">
            <p className="text-[11px] font-bold text-[#D22128]">Drive-Thru - انتباه الكاشير</p>
            <div className="mt-1 flex gap-4 text-xs text-[#24275D] font-semibold">
              <span>اللوحة: {resolveCarPlate(order)}</span>
              <span>اللون: {resolveCarColor(order)}</span>
            </div>
          </div>
        )}

        {order.status === 'shipped' && (
          <p className="text-xs font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg px-2.5 py-1.5">
            في الطريق إلى العميل
          </p>
        )}

        {order.notes && (
          <p className="text-xs text-[#24275D] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            ملاحظة العميل: {order.notes}
          </p>
        )}
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

      <div className="pt-1 border-t border-gray-100">
        <p className="text-[11px] text-slate-500">اضغط البطاقة لعرض تفاصيل الطلب واتخاذ الإجراء</p>
      </div>
    </motion.div>
  )
}

const NEXT_ACTION: Record<
  string,
  (orderType?: string) => { label: string; nextStatus: OrderStatus; colorClass: string } | null
> = {
  accepted:         () => ({ label: 'جاري التحضير',      nextStatus: 'preparing',        colorClass: 'bg-blue-600 hover:bg-blue-700' }),
  preparing:        () => ({ label: 'جاهز للتوصيل',      nextStatus: 'ready',            colorClass: 'bg-green-600 hover:bg-green-700' }),
  // للتوصيل: الكاشير لا يتجاوز "جاهز" — المندوب يتولى الباقي من تطبيقه
  ready:            (type) =>
    type === 'delivery'
      ? null
      : { label: 'وصل العميل', nextStatus: 'customer_arrived', colorClass: 'bg-teal-600 hover:bg-teal-700' },
  customer_arrived: () => ({ label: 'تم التسليم للعميل ✅', nextStatus: 'completed', colorClass: 'bg-emerald-600 hover:bg-emerald-700' }),
}

const DELIVERY_STATUS_INFO: Record<
  string,
  { text: string; colorClass: string; icon: React.ReactNode }
> = {
  ready:            { text: 'بانتظار استلام المندوب',          colorClass: 'bg-green-50 border-green-300 text-green-800',      icon: <PackageCheck size={15} /> },
  driver_assigned:  { text: 'المندوب في طريقه للمطعم',         colorClass: 'bg-purple-50 border-purple-300 text-purple-800',   icon: <Bike size={15} /> },
  at_restaurant:    { text: 'المندوب جاهز للاستلام',             colorClass: 'bg-indigo-50 border-indigo-300 text-indigo-800',   icon: <MapPin size={15} /> },
  handed_to_driver: { text: 'تم التسليم للمندوب ✓',            colorClass: 'bg-violet-50 border-violet-300 text-violet-800',   icon: <Handshake size={15} /> },
  shipped:          { text: 'المندوب في الطريق للعميل',         colorClass: 'bg-cyan-50 border-cyan-300 text-cyan-800',         icon: <Truck size={15} /> },
  completed:        { text: 'تم تسليم الطلب للعميل',           colorClass: 'bg-emerald-50 border-emerald-300 text-emerald-800', icon: <CheckCircle2 size={15} /> },
}

function OnlineOrderDetailsSheet({
  order,
  onClose,
  onAccept,
  onCancel,
  onUpdateStatus,
  isUpdating = false,
}: {
  order: Order | null
  onClose: () => void
  onAccept: (orderId: string) => Promise<void>
  onCancel: (orderId: string) => Promise<void>
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>
  isUpdating?: boolean
}) {
  if (!order) return null

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new
  const nextAction = NEXT_ACTION[order.status]?.(order.order_type)

  // الحالات التي يظهر فيها شريط معلومات المندوب للتوصيل
  const DELIVERY_DRIVER_STATES = ['ready', 'driver_assigned', 'at_restaurant', 'handed_to_driver', 'shipped', 'completed']
  const isDeliveryWaitingDriver =
    order.order_type === 'delivery' && DELIVERY_DRIVER_STATES.includes(order.status)
  const deliveryStatusInfo = isDeliveryWaitingDriver
    ? DELIVERY_STATUS_INFO[order.status]
    : null

  // زر "تم التسليم للمندوب" يظهر عند ready/driver_assigned/at_restaurant فقط
  const HANDOFF_STATES = ['ready', 'driver_assigned', 'at_restaurant']
  const showHandoffButton = order.order_type === 'delivery' && HANDOFF_STATES.includes(order.status)
  // يُفعَّل الزر فقط عندما يكون المندوب في المطعم
  const handoffEnabled = order.status === 'at_restaurant'

  // الحالات التي لا يجوز فيها إلغاء الطلب
  const NON_CANCELLABLE = ['new', 'completed', 'cancelled', 'handed_to_driver', 'shipped']
  const canCancel = !NON_CANCELLABLE.includes(order.status)

  const orderTypeLabel: Record<string, string> = {
    delivery: 'توصيل',
    pickup: 'استلام من الفرع',
    drive_thru: 'Drive-Thru',
  }

  return (
    <div className="absolute inset-0 z-10 flex pointer-events-none">
      <div className="flex-1 bg-black/35 pointer-events-auto" onClick={onClose} />
      <motion.aside
        initial={{ x: 360 }}
        animate={{ x: 0 }}
        exit={{ x: 360 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="w-full max-w-sm h-full bg-white border-r border-slate-200 shadow-2xl pointer-events-auto flex flex-col"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500">تفاصيل الطلب</p>
            <h3 className="font-bold text-[#24275D]">#{order.order_number}</h3>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            إغلاق
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
              {statusCfg.icon}
              {statusCfg.label}
            </div>
            {order.order_type && (
              <span className="px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600 text-[11px] font-semibold">
                {orderTypeLabel[order.order_type] ?? order.order_type}
              </span>
            )}
          </div>

          {order.customer_name && <p className="text-slate-700">العميل: {order.customer_name}</p>}
          {order.customer_phone && <p className="text-slate-700">الهاتف: {order.customer_phone}</p>}

          {order.order_type === 'drive_thru' && (order.car_plate_number || order.car_color) && (
            <div className="rounded-lg border border-[#D22128] bg-red-50 px-3 py-2 space-y-0.5">
              <p className="font-bold text-[#D22128]">Drive-Thru</p>
              {order.car_plate_number && <p className="text-[#24275D]">اللوحة: {order.car_plate_number}</p>}
              {order.car_color && <p className="text-[#24275D]">اللون: {order.car_color}</p>}
            </div>
          )}

          {order.notes && (
            <p className="text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2">
              ملاحظة: {order.notes}
            </p>
          )}

          <div className="space-y-1.5 border-t border-slate-100 pt-2">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-700">
                <span>{item.quantity}× {item.name}</span>
                <span>{(item.price * item.quantity).toFixed(2)} ر.س</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-slate-500">الإجمالي</span>
            <span className="font-bold text-[#D22128]">{order.total?.toFixed(2)} ر.س</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
          {/* مؤشر التحميل */}
          {isUpdating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-500 text-sm font-semibold"
            >
              <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
              جارٍ التحديث…
            </motion.div>
          )}

          {/* شريط حالة المندوب لطلبات التوصيل */}
          {deliveryStatusInfo && (
            <motion.div
              key={order.status}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2.5 px-4 py-3.5 rounded-xl border font-semibold text-sm ${deliveryStatusInfo.colorClass}`}
            >
              {deliveryStatusInfo.icon}
              <span>{deliveryStatusInfo.text}</span>
            </motion.div>
          )}

          {/* أزرار الكاشير العادية (فقط للحالات غير المرتبطة بالمندوب) */}
          {!deliveryStatusInfo && (
            <>
              {order.status === 'new' && (
                <div className="flex gap-2">
                  <button
                    disabled={isUpdating}
                    onClick={() => onAccept(order.id)}
                    className="bg-green-600 text-white p-3 rounded-lg flex-1 font-semibold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    قبول الطلب
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => onCancel(order.id)}
                    className="bg-red-600 text-white p-3 rounded-lg flex-1 font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    رفض
                  </button>
                </div>
              )}

              {nextAction && (
                <button
                  disabled={isUpdating}
                  onClick={() => onUpdateStatus(order.id, nextAction.nextStatus)}
                  className={`${nextAction.colorClass} text-white p-3 rounded-lg w-full font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {nextAction.label}
                </button>
              )}
            </>
          )}

          {/* زر تسليم الطلب للمندوب — الحماية القصوى */}
          {showHandoffButton && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              disabled={isUpdating || !handoffEnabled}
              onClick={() => onUpdateStatus(order.id, 'handed_to_driver')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl w-full font-semibold text-sm transition-all
                ${handoffEnabled
                  ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200'
                  : 'bg-violet-50 text-violet-300 border border-violet-200 cursor-not-allowed'
                } disabled:opacity-60`}
            >
              <Handshake size={16} />
              تم التسليم للمندوب
              {!handoffEnabled && (
                <span className="text-[10px] font-normal opacity-70">(بانتظار وصول المندوب)</span>
              )}
            </motion.button>
          )}

          {/* زر إلغاء الطلب */}
          {canCancel && (
            <button
              disabled={isUpdating}
              onClick={() => onCancel(order.id)}
              className="border border-red-200 text-red-600 p-2.5 rounded-lg w-full text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              إلغاء الطلب
            </button>
          )}
        </div>
      </motion.aside>
    </div>
  )
}

function resolveCarPlate(order: Order) {
  const dynamicOrder = order as Order & {
    car_plate?: string
    plate_number?: string
    vehicle_plate?: string
  }
  return (
    order.car_plate_number ||
    dynamicOrder.car_plate ||
    dynamicOrder.plate_number ||
    dynamicOrder.vehicle_plate ||
    'غير متوفر'
  )
}

function resolveCarColor(order: Order) {
  const dynamicOrder = order as Order & {
    vehicle_color?: string
  }
  return order.car_color || dynamicOrder.vehicle_color || 'غير متوفر'
}
