'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Minus, ShoppingCart, Receipt } from 'lucide-react'
import { useCart, useCartActions, usePOSStore } from '@/store/usePOSStore'

export default function CartSidebar() {
  const { cart, subtotal, tax, total } = useCart()
  const { removeFromCart, updateQuantity, clearCart } = useCartActions()
  const openPaymentModal = usePOSStore((s) => s.openPaymentModal)

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShoppingCart size={20} className="text-[#24275D]" />
          <h2 className="font-bold text-[#24275D] text-base">الفاتورة الحية</h2>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-gray-400 hover:text-[#D22128] flex items-center gap-1 transition-colors"
          >
            <Trash2 size={13} />
            مسح الكل
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <AnimatePresence initial={false}>
          {cart.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-48 gap-3 text-gray-300"
            >
              <Receipt size={48} strokeWidth={1.2} />
              <p className="text-sm text-gray-400">السلة فارغة</p>
            </motion.div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100"
              >
                {/* Name & Price */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.price.toFixed(2)} ر.س / الوحدة
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:border-[#D22128] hover:text-[#D22128] transition-colors text-gray-600"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-[#24275D]">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#24275D] text-white hover:bg-[#D22128] transition-colors"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Subtotal */}
                <span className="text-sm font-bold text-[#D22128] w-16 text-left">
                  {item.subtotal.toFixed(2)}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Totals */}
      <div className="border-t border-gray-100 px-5 py-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>المجموع الفرعي</span>
          <span>{subtotal.toFixed(2)} ر.س</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>ضريبة القيمة المضافة (15%)</span>
          <span className="text-amber-600">{tax.toFixed(2)} ر.س</span>
        </div>
        <div className="flex justify-between font-bold text-[#24275D] text-base border-t pt-2 mt-1">
          <span>الإجمالي</span>
          <span>{total.toFixed(2)} ر.س</span>
        </div>

        {/* Checkout Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={openPaymentModal}
          disabled={cart.length === 0}
          className="w-full mt-3 py-3.5 rounded-xl bg-[#D22128] hover:bg-[#b81c22] text-white font-bold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#D22128]/20"
        >
          الدفع الآن
        </motion.button>
      </div>
    </div>
  )
}
