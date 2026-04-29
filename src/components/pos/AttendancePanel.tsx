'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  Clock,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  UserCircle,
  X,
} from 'lucide-react'
import {
  useAttendanceStore,
  localDateKey,
  ROLE_PRESETS,
  type BranchEmployee,
} from '@/store/useAttendanceStore'

function toTimeInput(v: string | null) {
  return v ?? ''
}

export default function AttendancePanel() {
  const employees = useAttendanceStore((s) => s.employees)
  const records = useAttendanceStore((s) => s.records)
  const addEmployee = useAttendanceStore((s) => s.addEmployee)
  const updateEmployee = useAttendanceStore((s) => s.updateEmployee)
  const removeEmployee = useAttendanceStore((s) => s.removeEmployee)
  const getRecord = useAttendanceStore((s) => s.getRecord)
  const clockIn = useAttendanceStore((s) => s.clockIn)
  const clockOut = useAttendanceStore((s) => s.clockOut)
  const setAttendance = useAttendanceStore((s) => s.setAttendance)

  const [date, setDate] = useState(() => localDateKey())
  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; emp: BranchEmployee } | null>(
    null
  )

  const sorted = useMemo(
    () => [...employees].sort((a, b) => a.firstName.localeCompare(b.firstName, 'ar')),
    [employees]
  )

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#F8F9FA]" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#24275D]/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#24275D]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-[#24275D] text-base leading-tight">الحضور والانصراف</h2>
            <p className="text-xs text-gray-500 truncate">فرع — تسجيل وقائمة الموظفين</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2">
            <CalendarDays className="w-4 h-4 text-[#24275D] shrink-0" />
            <span className="text-xs font-semibold text-gray-500">اليوم</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || localDateKey())}
              className="bg-transparent border-0 text-sm font-mono text-gray-800 focus:outline-none focus:ring-0 min-w-0"
            />
          </label>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D22128] text-white text-sm font-bold shadow-md shadow-[#D22128]/20"
          >
            <Plus className="w-4 h-4" />
            موظف جديد
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
          >
            <UserCircle className="w-14 h-14 text-gray-200 mb-3" strokeWidth={1.25} />
            <p className="font-bold text-gray-700">لا يوجد موظفون بعد</p>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">أضف موظفاً مع اسمه الأول ووظيفته.</p>
            <button
              type="button"
              onClick={() => setModal({ mode: 'add' })}
              className="mt-4 px-5 py-2.5 rounded-xl bg-[#24275D] text-white text-sm font-bold"
            >
              إضافة موظف
            </button>
          </motion.div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            <AnimatePresence initial={false}>
              {sorted.map((emp, index) => {
                const rec = getRecord(emp.id, date)
                const checkIn = rec?.checkIn ?? null
                const checkOut = rec?.checkOut ?? null

                return (
                  <motion.article
                    key={emp.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28, delay: index * 0.02 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-[#24275D]/10 flex items-center justify-center shrink-0">
                          <UserCircle className="w-6 h-6 text-[#24275D]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 text-base">{emp.firstName}</p>
                          <p className="text-sm text-[#D22128] font-semibold mt-0.5">{emp.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setModal({ mode: 'edit', emp })}
                          className="p-2.5 rounded-xl border border-gray-200 text-[#24275D] hover:bg-slate-50"
                          aria-label="تعديل بيانات الموظف"
                        >
                          <Pencil className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            if (typeof window !== 'undefined' && !window.confirm('حذف هذا الموظف وسجلاته؟'))
                              return
                            removeEmployee(emp.id)
                          }}
                          className="p-2.5 rounded-xl border border-gray-200 text-red-600 hover:bg-red-50"
                          aria-label="حذف الموظف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                          وقت الحضور
                        </span>
                        <input
                          type="time"
                          value={toTimeInput(checkIn)}
                          onChange={(e) => {
                            const v = e.target.value
                            setAttendance(emp.id, date, { checkIn: v ? v : null })
                          }}
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono bg-slate-50 focus:border-[#24275D] focus:ring-1 focus:ring-[#24275D]/30 outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                          وقت الانصراف
                        </span>
                        <input
                          type="time"
                          value={toTimeInput(checkOut)}
                          onChange={(e) => {
                            const v = e.target.value
                            setAttendance(emp.id, date, { checkOut: v ? v : null })
                          }}
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono bg-slate-50 focus:border-[#24275D] focus:ring-1 focus:ring-[#24275D]/30 outline-none"
                        />
                      </label>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => clockIn(emp.id, date)}
                        disabled={!!checkIn}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <LogIn className="w-4 h-4" />
                        تسجيل حضور الآن
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => clockOut(emp.id, date)}
                        disabled={!!checkOut}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#24275D] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <LogOut className="w-4 h-4" />
                        تسجيل انصراف الآن
                      </motion.button>
                    </div>
                  </motion.article>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <EmployeeModal
            key={modal.mode === 'add' ? 'add' : modal.emp.id}
            modal={modal}
            onClose={() => setModal(null)}
            onSaveAdd={(firstName, role) => {
              addEmployee(firstName, role)
              setModal(null)
            }}
            onSaveEdit={(id, firstName, role) => {
              updateEmployee(id, { firstName, role })
              setModal(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EmployeeModal({
  modal,
  onClose,
  onSaveAdd,
  onSaveEdit,
}: {
  modal: { mode: 'add' } | { mode: 'edit'; emp: BranchEmployee }
  onClose: () => void
  onSaveAdd: (firstName: string, role: string) => void
  onSaveEdit: (id: string, firstName: string, role: string) => void
}) {
  const initialName = modal.mode === 'edit' ? modal.emp.firstName : ''
  const initialRole = modal.mode === 'edit' ? modal.emp.role : ROLE_PRESETS[0]
  const [firstName, setFirstName] = useState(initialName)
  const [role, setRole] = useState(initialRole)
  const [customOpen, setCustomOpen] = useState(() =>
    modal.mode === 'edit' && !(ROLE_PRESETS as readonly string[]).includes(modal.emp.role)
  )

  const isEdit = modal.mode === 'edit'

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        dir="rtl"
      >
        <div className="flex items-center justify-between px-5 py-4 bg-[#24275D] text-white">
          <h3 className="font-bold text-base">{isEdit ? 'تعديل موظف' : 'موظف جديد'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/15 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          className="p-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const r = role.trim()
            const n = firstName.trim()
            if (!n) return
            if (isEdit) onSaveEdit(modal.emp.id, n, r)
            else onSaveAdd(n, r)
          }}
        >
          <div>
            <label className="text-xs font-bold text-gray-600">الاسم الأول</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="مثال: خالد"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#24275D] focus:ring-1 focus:ring-[#24275D]/30 outline-none"
              autoComplete="given-name"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600">الوظيفة</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setRole(p)
                    setCustomOpen(false)
                  }}
                  className={`px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
                    role === p && !customOpen
                      ? 'bg-[#24275D] text-white border-[#24275D]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#24275D]/40'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomOpen(true)}
                className={`px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
                  customOpen
                    ? 'bg-[#24275D] text-white border-[#24275D]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#24275D]/40'
                }`}
              >
                أخرى
              </button>
            </div>
            {customOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2"
              >
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="اكتب المسمى الوظيفي..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#24275D] focus:ring-1 focus:ring-[#24275D]/30 outline-none"
                />
              </motion.div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#D22128] text-white font-bold text-base hover:bg-[#b81c22] transition-colors"
          >
            {isEdit ? 'حفظ التعديلات' : 'إضافة'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}
