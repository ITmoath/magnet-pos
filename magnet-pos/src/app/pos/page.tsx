'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, Bell, UserCheck } from 'lucide-react'
import dynamic from 'next/dynamic'
import { usePOSStore, useOnlineOrders, useCart } from '@/store/usePOSStore'

const POSHeader = dynamic(() => import('@/components/pos/Header'), { ssr: false })
const ProductGrid = dynamic(() => import('@/components/pos/ProductGrid'), { ssr: false })
const CartSidebar = dynamic(() => import('@/components/pos/CartSidebar'), { ssr: false })
const OnlineOrdersNotification = dynamic(() => import('@/components/pos/OnlineOrdersNotification'), { ssr: false })
const PaymentModal = dynamic(() => import('@/components/pos/PaymentModal'), { ssr: false })
const AttendancePanel = dynamic(() => import('@/components/pos/AttendancePanel'), { ssr: false })

type ActivePanel = 'menu' | 'orders' | 'attendance'

export default function POSPage() {
  const [activePanel, setActivePanel] = useState<ActivePanel>('menu')
  const { pendingCount } = useOnlineOrders()

  return (
    <div className="h-screen bg-[#F8F9FA] flex flex-col overflow-hidden" dir="rtl">

      {/* ===== TOP STATUS BAR ===== */}
      <POSHeader />

      {/* ===== PANEL TABS ===== */}
      <div className="flex bg-white border-b border-gray-200 flex-shrink-0">
        <TabButton
          active={activePanel === 'menu'}
          onClick={() => setActivePanel('menu')}
          icon={<LayoutGrid size={15} />}
          label="المنيو"
        />
        <TabButton
          active={activePanel === 'orders'}
          onClick={() => setActivePanel('orders')}
          icon={<Bell size={15} />}
          label="الطلبات"
          badge={pendingCount}
        />
        <TabButton
          active={activePanel === 'attendance'}
          onClick={() => setActivePanel('attendance')}
          icon={<UserCheck size={15} />}
          label="الحضور"
        />
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <main className="flex-1 flex overflow-hidden">
        {/* === PRODUCT GRID === */}
        {activePanel !== 'attendance' && (
          <section
            className={`${
              activePanel === 'menu' ? 'flex' : 'hidden'
            } md:flex flex-1 overflow-hidden bg-[#F8F9FA] min-w-0`}
          >
            <ProductGrid />
          </section>
        )}

        {/* === ATTENDANCE === */}
        {activePanel === 'attendance' && (
          <section className="flex flex-1 min-w-0 overflow-hidden bg-[#F8F9FA]">
            <AttendancePanel />
          </section>
        )}

        {/* === ONLINE ORDERS PANEL === */}
        {activePanel !== 'attendance' && (
          <aside
            className={`${
              activePanel === 'orders' ? 'flex' : 'hidden'
            } md:flex w-full md:w-80 xl:w-96 border-l border-gray-200 bg-white overflow-hidden flex-col flex-shrink-0`}
          >
            <OnlineOrdersNotification />
          </aside>
        )}

        {/* === CART SIDEBAR === */}
        <aside className="hidden lg:flex w-80 xl:w-96 border-l border-gray-200 flex-col flex-shrink-0">
          <CartSidebar />
        </aside>
      </main>

      {/* ===== MOBILE CART (Bottom Sheet Trigger) ===== */}
      <MobileCartBar />

      {/* ===== PAYMENT MODAL ===== */}
      <PaymentModal />
    </div>
  )
}

// --- Tab Button ---
function TabButton({
  active, onClick, icon, label, badge,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors relative ${
        active
          ? 'border-[#24275D] text-[#24275D]'
          : 'border-transparent text-gray-400 hover:text-gray-600'
      }`}
    >
      {icon}
      {label}
      {!!badge && badge > 0 && (
        <span className="absolute top-2 right-[calc(50%-12px)] w-4 h-4 flex items-center justify-center rounded-full bg-[#D22128] text-white text-[9px] font-bold">
          {badge}
        </span>
      )}
    </button>
  )
}

// --- Mobile Cart Bar (sticky bottom) ---
function MobileCartBar() {
  const openPaymentModal = usePOSStore((s) => s.openPaymentModal)
  const { cart, total } = useCart()

  if (cart.length === 0) return null

  const itemCount = cart.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      exit={{ y: 80 }}
      className="lg:hidden fixed bottom-0 inset-x-0 p-4 bg-white border-t border-gray-200 shadow-2xl z-40"
      dir="rtl"
    >
      <button
        onClick={openPaymentModal}
        className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-[#D22128] text-white font-bold shadow-lg"
      >
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">{itemCount} عناصر</span>
        <span>الدفع الآن</span>
        <span>{total.toFixed(2)} ر.س</span>
      </button>
    </motion.div>
  )
}
