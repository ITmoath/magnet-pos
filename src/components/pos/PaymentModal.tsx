'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Banknote, CreditCard, Wallet, Loader2, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { usePOSStore } from '@/store/usePOSStore'
import { useCart } from '@/store/usePOSStore'
import type { PaymentMethod } from '@/lib/supabase'

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'cash', label: 'نقداً', icon: <Banknote size={28} />, color: 'bg-emerald-500' },
  { id: 'card', label: 'بطاقة', icon: <CreditCard size={28} />, color: 'bg-blue-500' },
  { id: 'wallet', label: 'محفظة إلكترونية', icon: <Wallet size={28} />, color: 'bg-purple-500' },
]

export default function PaymentModal() {
  const isOpen = usePOSStore((s) => s.isPaymentModalOpen)
  const closeModal = usePOSStore((s) => s.closePaymentModal)
  const checkoutOrder = usePOSStore((s) => s.checkoutOrder)
  const isProcessing = usePOSStore((s) => s.isProcessing)
  const { total, tax, subtotal } = useCart()

  const [selected, setSelected] = useState<PaymentMethod>('cash')
  const [success, setSuccess] = useState(false)

  const handleConfirm = async () => {
    const result = await checkoutOrder(selected)
    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setSelected('cash')
      }, 2000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <motion.div
            className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#24275D] text-white">
              <h2 className="text-lg font-bold">إتمام الدفع</h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Success State */}
            <AnimatePresence>
              {success && (
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <CheckCircle2 size={72} className="text-emerald-500" />
                  </motion.div>
                  <p className="text-xl font-bold text-gray-800">تم الدفع بنجاح!</p>
                  <p className="text-gray-500 text-sm">جاري طباعة الفاتورة...</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الفرعي</span>
                  <span>{subtotal.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ضريبة القيمة المضافة (15%)</span>
                  <span>{tax.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-[#24275D] font-bold text-base border-t pt-2 mt-1">
                  <span>الإجمالي</span>
                  <span>{total.toFixed(2)} ر.س</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">طريقة الدفع</p>
                <div className="grid grid-cols-3 gap-3">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelected(method.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selected === method.id
                          ? 'border-[#24275D] bg-[#24275D]/5 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span
                        className={`w-12 h-12 flex items-center justify-center rounded-full text-white ${method.color}`}
                      >
                        {method.icon}
                      </span>
                      <span className="text-xs font-medium text-gray-700">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#D22128] hover:bg-[#b81c22] text-white font-bold text-base transition-colors disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  `تأكيد الدفع — ${total.toFixed(2)} ر.س`
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
