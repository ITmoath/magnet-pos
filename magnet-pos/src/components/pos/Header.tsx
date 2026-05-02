'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, ChefHat, ListTodo, Wifi, WifiOff } from 'lucide-react'
import { usePOSStore, useOnlineOrders } from '@/store/usePOSStore'
import { useBranchTasksStore, selectIncompleteTasksCount } from '@/store/useBranchTasksStore'

export default function POSHeader() {
  const { pendingCount } = useOnlineOrders()
  const isConnected = usePOSStore((s) => s.isConnected)
  const kitchenCount = usePOSStore((s) => s.kitchenTickets.length)
  const tasksIncomplete = useBranchTasksStore((s) => selectIncompleteTasksCount(s))

  return (
    <header
      className="flex items-center justify-between px-5 py-3 bg-[#24275D] text-white shadow-lg flex-shrink-0"
      dir="rtl"
    >
      {/* ===== Brand / Logo ===== */}
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-32">
          <Image
            src="/logos/logo-light.png"
            alt="Magnet POS"
            fill
            sizes="128px"
            className="object-contain object-right"
            priority
          />
        </div>

        <div className="h-5 w-px bg-white/20" />

        <span className="text-xs text-white/60 hidden sm:block">
          نقاط البيع — الكاشير
        </span>
      </div>

      {/* ===== Status Indicators ===== */}
      <div className="flex items-center gap-2.5 flex-wrap justify-end">
        {/* Online Orders Badge */}
        <AnimatePresence>
          {pendingCount > 0 && (
            <motion.div
              key="badge"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D22128] text-white text-xs font-bold"
            >
              <Bell size={12} className="animate-bounce" />
              {pendingCount} طلب جديد
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Status */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            isConnected
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-red-500/20 text-red-300'
          }`}
        >
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden sm:inline">
            {isConnected ? 'متصل بالسيرفر' : 'غير متصل'}
          </span>
          {isConnected && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>

        {/* Live Clock */}
        <LiveClock />

        {/* المهام — بجانب المطبخ */}
        <Link
          href="/pos/tasks"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors border border-white/20 relative"
        >
          <ListTodo size={14} className="shrink-0" />
          <span className="hidden sm:inline">المهام</span>
          {tasksIncomplete > 0 && (
            <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-amber-500 text-[10px] font-extrabold text-[#24275D] border-2 border-[#24275D]">
              {tasksIncomplete > 99 ? '99+' : tasksIncomplete}
            </span>
          )}
        </Link>

        {/* شاشة المطبخ */}
        <Link
          href="/pos/kitchen"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors border border-white/20 relative"
        >
          <ChefHat size={14} className="shrink-0" />
          <span className="hidden sm:inline">شاشة المطبخ</span>
          {kitchenCount > 0 && (
            <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#D22128] text-[10px] font-extrabold text-white border-2 border-[#24275D]">
              {kitchenCount > 99 ? '99+' : kitchenCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}

function LiveClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
      })
    setTime(fmt())
    const id = setInterval(() => setTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="text-xs text-white/70 font-mono tabular-nums hidden sm:inline">
      {time}
    </span>
  )
}
