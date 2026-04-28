'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Wifi, WifiOff } from 'lucide-react'
import { usePOSStore, useOnlineOrders } from '@/store/usePOSStore'

export default function POSHeader() {
  const { pendingCount } = useOnlineOrders()
  const isConnected = usePOSStore((s) => s.isConnected)

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
      <div className="flex items-center gap-2.5">
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
