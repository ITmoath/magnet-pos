import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface BranchEmployee {
  id: string
  /** الاسم الأول (أو الاسم المعروض للموظف) */
  firstName: string
  /** الوظيفة: طباخ، كاشير، ويتر، أو أي نص تعدّله */
  role: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  /** YYYY-MM-DD حسب التوقيت المحلي */
  date: string
  /** HH:mm أو null */
  checkIn: string | null
  checkOut: string | null
}

const ROLE_PRESETS = ['طباخ', 'كاشير', 'ويتر'] as const

export { ROLE_PRESETS }

export function localDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function nowHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** موظفون ابتدائيون للفرع — معرّفات ثابتة لتفادي التكرار عند إعادة التحميل */
const SEED_EMPLOYEES: BranchEmployee[] = [
  { id: 'emp-seed-1', firstName: 'خالد', role: 'كاشير' },
  { id: 'emp-seed-2', firstName: 'نورة', role: 'ويتر' },
  { id: 'emp-seed-3', firstName: 'فهد', role: 'طباخ' },
  { id: 'emp-seed-4', firstName: 'سارة', role: 'كاشير' },
  { id: 'emp-seed-5', firstName: 'عبدالله', role: 'طباخ' },
]

interface AttendanceState {
  employees: BranchEmployee[]
  records: AttendanceRecord[]

  addEmployee: (firstName: string, role: string) => void
  updateEmployee: (id: string, patch: Partial<Pick<BranchEmployee, 'firstName' | 'role'>>) => void
  removeEmployee: (id: string) => void

  getRecord: (employeeId: string, date: string) => AttendanceRecord | undefined
  clockIn: (employeeId: string, date: string) => void
  clockOut: (employeeId: string, date: string) => void
  setAttendance: (
    employeeId: string,
    date: string,
    patch: { checkIn?: string | null; checkOut?: string | null }
  ) => void
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      employees: SEED_EMPLOYEES,
      records: [],

      addEmployee: (firstName, role) => {
        const name = firstName.trim()
        if (!name) return
        set((s) => ({
          employees: [...s.employees, { id: genId('emp'), firstName: name, role: role.trim() || 'موظف' }],
        }))
      },

      updateEmployee: (id, patch) => {
        set((s) => ({
          employees: s.employees.map((e) =>
            e.id === id
              ? {
                  ...e,
                  ...(patch.firstName !== undefined ? { firstName: patch.firstName.trim() || e.firstName } : {}),
                  ...(patch.role !== undefined ? { role: patch.role.trim() || e.role } : {}),
                }
              : e
          ),
        }))
      },

      removeEmployee: (id) => {
        set((s) => ({
          employees: s.employees.filter((e) => e.id !== id),
          records: s.records.filter((r) => r.employeeId !== id),
        }))
      },

      getRecord: (employeeId, date) =>
        get().records.find((r) => r.employeeId === employeeId && r.date === date),

      clockIn: (employeeId, date) => {
        const { getRecord, setAttendance } = get()
        const existing = getRecord(employeeId, date)
        if (existing?.checkIn) return
        setAttendance(employeeId, date, { checkIn: nowHHMM() })
      },

      clockOut: (employeeId, date) => {
        get().setAttendance(employeeId, date, { checkOut: nowHHMM() })
      },

      setAttendance: (employeeId, date, patch) => {
        set((s) => {
          const idx = s.records.findIndex((r) => r.employeeId === employeeId && r.date === date)
          if (idx === -1) {
            const rec: AttendanceRecord = {
              id: genId('att'),
              employeeId,
              date,
              checkIn: patch.checkIn !== undefined ? patch.checkIn : null,
              checkOut: patch.checkOut !== undefined ? patch.checkOut : null,
            }
            return { records: [...s.records, rec] }
          }
          const next = [...s.records]
          const cur = { ...next[idx] }
          if (patch.checkIn !== undefined) cur.checkIn = patch.checkIn
          if (patch.checkOut !== undefined) cur.checkOut = patch.checkOut
          next[idx] = cur
          return { records: next }
        })
      },
    }),
    {
      name: 'magnet-pos-attendance',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ employees: s.employees, records: s.records }),
    }
  )
)
