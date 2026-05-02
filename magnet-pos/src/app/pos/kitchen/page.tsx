'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChefHat, ClipboardList, Trash2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { usePOSStore } from '@/store/usePOSStore'
import { getPrepIngredientVisual } from '@/lib/kitchenPrepIcons'

const CATEGORY_LABEL: Record<string, string> = {
  all: 'الكل',
  burger: 'برجر',
  pizza: 'بيتزا',
  sandwich: 'ساندويش',
  drinks: 'مشروبات',
  desserts: 'حلويات',
  sides: 'مقبلات',
}

/** تمييز بصري لكل نوع وجبة داخل نفس الفاتورة */
const MEAL_ACCENT: Record<string, { border: string; ring: string; emoji: string }> = {
  burger: {
    border: 'border-s-[#D22128]',
    ring: 'ring-1 ring-[#D22128]/20',
    emoji: '🍔',
  },
  pizza: {
    border: 'border-s-[#24275D]',
    ring: 'ring-1 ring-[#24275D]/25',
    emoji: '🍕',
  },
  sandwich: {
    border: 'border-s-emerald-600',
    ring: 'ring-1 ring-emerald-600/20',
    emoji: '🥪',
  },
  drinks: {
    border: 'border-s-sky-600',
    ring: 'ring-1 ring-sky-500/25',
    emoji: '🥤',
  },
  desserts: {
    border: 'border-s-pink-600',
    ring: 'ring-1 ring-pink-500/25',
    emoji: '🍰',
  },
  sides: {
    border: 'border-s-amber-600',
    ring: 'ring-1 ring-amber-500/25',
    emoji: '🍟',
  },
}

const DEFAULT_MEAL_ACCENT = {
  border: 'border-s-slate-500',
  ring: 'ring-1 ring-slate-200',
  emoji: '🍽️',
}

export default function KitchenPage() {
  const { kitchenTickets, removeKitchenTicket } = usePOSStore(
    useShallow((s) => ({
      kitchenTickets: s.kitchenTickets,
      removeKitchenTicket: s.removeKitchenTicket,
    }))
  )

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col overflow-hidden" dir="rtl">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-[#24275D] text-white shadow-lg flex-shrink-0"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold truncate">شاشة المطبخ</h1>
            <p className="text-[11px] sm:text-xs text-white/65 truncate">
              قائمة التحضير — كل وجبة بعناصرها ونوعها
            </p>
          </div>
        </div>

        <motion.div whileTap={{ scale: 0.97 }}>
          <Link
            href="/pos"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-sm font-bold transition-colors shrink-0"
          >
            <span className="hidden sm:inline">العودة للكاشير</span>
            <span className="sm:hidden text-xs">رجوع</span>
            <ArrowRight className="w-4 h-4 shrink-0 opacity-90" />
          </Link>
        </motion.div>
      </motion.header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {kitchenTickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-gray-800 font-bold text-base">لا توجد طلبات في انتظار المطبخ</p>
              <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto leading-relaxed">
                بعد إتمام الدفع من شاشة نقطة البيع، تظهر الوجبات هنا مع مكوناتها لفريق المطبخ.
              </p>
            </div>
            <Link
              href="/pos"
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#D22128] text-white text-sm font-bold hover:bg-[#b81c22] transition-colors"
            >
              فتح نقطة البيع
            </Link>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 max-w-[1600px] mx-auto"
          >
            <AnimatePresence mode="popLayout">
              {kitchenTickets.map((ticket, index) => (
                <motion.article
                  key={ticket.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 26, delay: index * 0.03 }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-gray-100">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium">رقم الطلب (فاتورة)</p>
                      <p className="font-mono font-bold text-[#24275D] text-sm truncate">{ticket.orderNumber}</p>
                    </div>
                    <time className="text-xs text-gray-500 shrink-0 tabular-nums">
                      {new Date(ticket.createdAt).toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>

                  <div className="flex-1 flex flex-col gap-4 p-4">
                    {ticket.items.map((line, mealIndex) => {
                      const accent = MEAL_ACCENT[line.category] ?? DEFAULT_MEAL_ACCENT
                      const typeLabel = CATEGORY_LABEL[line.category] ?? line.category

                      return (
                        <motion.section
                          key={`${ticket.id}-${line.name}-${mealIndex}`}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 320,
                            damping: 28,
                            delay: mealIndex * 0.05,
                          }}
                          className={[
                            'rounded-xl bg-slate-50/80 border border-gray-200/90 border-s-4 shadow-sm',
                            accent.border,
                            accent.ring,
                          ].join(' ')}
                        >
                          {/* رأس الوجبة — نوع واضح ومختلف عن باقي بنود الفاتورة */}
                          <div className="flex items-start gap-3 px-4 pt-4 pb-2">
                            <span
                              className="text-2xl leading-none shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm"
                              aria-hidden
                            >
                              {accent.emoji}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2 gap-y-1">
                                <h2 className="font-bold text-gray-900 text-base leading-snug">{line.name}</h2>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#24275D] text-white">
                                  النوع: {typeLabel}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                بند {mealIndex + 1} من {ticket.items.length} في الطلب
                              </p>
                            </div>
                            <span className="shrink-0 min-w-[2.75rem] h-10 rounded-xl bg-[#D22128] text-white font-extrabold text-sm flex items-center justify-center px-2 shadow-md shadow-[#D22128]/25">
                              ×{line.quantity}
                            </span>
                          </div>

                          {/* قائمة تحضير عمودية — كل سطر: أيقونة + اسم المكوّن */}
                          {line.ingredients.length > 0 ? (
                            <ol className="flex flex-col gap-0 px-3 pb-4 pt-1">
                              {line.ingredients.map((ing, ingIndex) => {
                                const { Icon, boxClass } = getPrepIngredientVisual(ing)
                                return (
                                  <motion.li
                                    key={`${ing}-${ingIndex}`}
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                      type: 'spring',
                                      stiffness: 400,
                                      damping: 28,
                                      delay: ingIndex * 0.04,
                                    }}
                                    className="flex items-center gap-3 py-2.5 border-b border-gray-200/70 last:border-b-0"
                                  >
                                    <div
                                      className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${boxClass} shadow-inner`}
                                    >
                                      <Icon className="w-5 h-5" strokeWidth={2} aria-hidden />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 leading-snug">{ing}</p>
                                    </div>
                                  </motion.li>
                                )
                              })}
                            </ol>
                          ) : (
                            <p className="px-4 pb-4 text-sm text-gray-400">لا توجد مكوّنات مفصّلة لهذا البند.</p>
                          )}
                        </motion.section>
                      )
                    })}
                  </div>

                  <div className="p-3 border-t border-gray-100 bg-slate-50/80">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => removeKitchenTicket(ticket.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-[#24275D] hover:bg-[#1a1d47] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      تم التجهيز — إزالة من القائمة
                    </motion.button>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  )
}
