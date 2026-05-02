import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { localDateKey } from '@/store/useAttendanceStore'

export type TaskRecurrence = 'daily' | 'weekly' | 'monthly' | 'adhoc'

export interface BranchTaskDef {
  id: string
  title: string
  description?: string
  recurrence: TaskRecurrence
  /** مطلوب للمهام غير الدورية — YYYY-MM-DD */
  dueDate?: string
}

/** تعريفات المهام ثابتة من النظام؛ الفرع لا يضيف مهاماً هنا. */
export const BRANCH_TASK_DEFINITIONS: BranchTaskDef[] = [
  // ——— يومية ———
  {
    id: 'td-d1',
    recurrence: 'daily',
    title: 'تنظيف منطقة الكاشير وترتيب الطابور',
    description: 'تعقيم لوحة المفاتيح والشاشة وإزالة التشويش البصري.',
  },
  {
    id: 'td-d2',
    recurrence: 'daily',
    title: 'مراجعة درجة حرارة الثلاجة والفريزر',
    description: 'تسجيل القراءة وإبلاغ المسؤول عند أي انحراف.',
  },
  {
    id: 'td-d3',
    recurrence: 'daily',
    title: 'فحص أقرب تواريخ انتهاء للمواد المعروضة',
    description: 'FIFO للمنتجات القصيرة الأجل.',
  },
  {
    id: 'td-d4',
    recurrence: 'daily',
    title: 'تسوية مراجعة الصندوق وقيود اليوم',
    description: 'مطابقة النقد مع تقرير نقطة البيع قبل الإغلاق.',
  },

  // ——— أسبوعية ———
  {
    id: 'td-w1',
    recurrence: 'weekly',
    title: 'جرد سريع للمواد الأولية في المخزن',
    description: 'تحديث الكميات التقريبية للمكونات الحرجة.',
  },
  {
    id: 'td-w2',
    recurrence: 'weekly',
    title: 'تنظيف عميق لمنطقة التحضير والمقالي',
    description: 'يشمل الزوايا، الشفاط، وأرضيات منطقة القلي.',
  },
  {
    id: 'td-w3',
    recurrence: 'weekly',
    title: 'مراجعة نظافة معدات المطبخ الرئيسية',
    description: 'خلاط، مقصّات، وألواح التقطيع.',
  },

  // ——— شهرية ———
  {
    id: 'td-m1',
    recurrence: 'monthly',
    title: 'صيانة دورية لأجهزة نقطة البيع والطابعات',
    description: 'تنظيف رؤوس الطباعة واختبار الشبكة.',
  },
  {
    id: 'td-m2',
    recurrence: 'monthly',
    title: 'مراجعة عقود الموردين والاشتراكات',
    description: 'التحقق من التجديدات والأسعار المعقودة.',
  },
  {
    id: 'td-m3',
    recurrence: 'monthly',
    title: 'تحديث بيانات التواصل والعروض في النظام',
    description: 'أرقام الطوارئ، ساعات العمل، والعروض الحالية.',
  },

  // ——— غير دورية (مهام فرع محددة بمواعيد) ———
  {
    id: 'td-a1',
    recurrence: 'adhoc',
    title: 'تحديث قائمة الأسعار الورقية والرقمية',
    description: 'تزامن المنيو مع النظام بعد اعتماد الإدارة.',
    dueDate: '2026-04-30',
  },
  {
    id: 'td-a2',
    recurrence: 'adhoc',
    title: 'استلام شحنة مورد (مجمّد)',
    description: 'مطابقة أرقام التسليم مع أمر الشراء.',
    dueDate: '2026-05-02',
  },
  {
    id: 'td-a3',
    recurrence: 'adhoc',
    title: 'حضور دورة صحية وسلامة للفريق',
    description: 'تأكيد أسماء الحاضرين ورفع الشهادات.',
    dueDate: '2026-05-08',
  },
]

export function isoWeekPeriodKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

function monthlyPeriodKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** مفتاح الفترة الحالية لإكمال المهمة */
export function periodKeyForTask(task: BranchTaskDef, ref: Date = new Date()): string {
  switch (task.recurrence) {
    case 'daily':
      return localDateKey(ref)
    case 'weekly':
      return isoWeekPeriodKey(ref)
    case 'monthly':
      return monthlyPeriodKey(ref)
    case 'adhoc':
      return 'once'
    default:
      return 'once'
  }
}

/** تاريخ آخر موعد نهائي للعرض YYYY-MM-DD */
export function deadlineDateForTask(task: BranchTaskDef, ref: Date = new Date()): string {
  switch (task.recurrence) {
    case 'daily':
      return localDateKey(ref)
    case 'weekly':
      return endOfWeekSaturday(ref)
    case 'monthly':
      return lastDayOfMonth(ref)
    case 'adhoc':
      return task.dueDate ?? localDateKey(ref)
    default:
      return localDateKey(ref)
  }
}

function endOfWeekSaturday(ref: Date): string {
  const d = new Date(ref)
  const day = d.getDay()
  const daysUntilSat = (6 - day + 7) % 7
  d.setDate(d.getDate() + daysUntilSat)
  return localDateKey(d)
}

function lastDayOfMonth(ref: Date): string {
  const y = ref.getFullYear()
  const m = ref.getMonth()
  const last = new Date(y, m + 1, 0)
  return localDateKey(last)
}

function completionKey(taskId: string, periodKey: string) {
  return `${taskId}:${periodKey}`
}

export interface BranchTasksState {
  /** مفتاح: taskId:periodKey → مكتملة */
  completions: Record<string, boolean>
  toggleTaskComplete: (taskId: string) => void
  isTaskComplete: (task: BranchTaskDef, ref?: Date) => boolean
}

export const useBranchTasksStore = create<BranchTasksState>()(
  persist(
    (set, get) => ({
      completions: {},

      isTaskComplete: (task, ref = new Date()) => {
        const pk = periodKeyForTask(task, ref)
        return !!get().completions[completionKey(task.id, pk)]
      },

      toggleTaskComplete: (taskId) => {
        const task = BRANCH_TASK_DEFINITIONS.find((t) => t.id === taskId)
        if (!task) return
        const pk = periodKeyForTask(task)
        const key = completionKey(task.id, pk)
        set((s) => ({
          completions: { ...s.completions, [key]: !s.completions[key] },
        }))
      },
    }),
    {
      name: 'magnet-pos-branch-tasks',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ completions: s.completions }),
    }
  )
)

export function selectIncompleteTasksCount(state: BranchTasksState, ref: Date = new Date()): number {
  return BRANCH_TASK_DEFINITIONS.reduce((acc, t) => {
    const pk = periodKeyForTask(t, ref)
    if (state.completions[completionKey(t.id, pk)]) return acc
    return acc + 1
  }, 0)
}

export function formatDeadlineAr(ymd: string): string {
  const [y, m, day] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, day)
  return dt.toLocaleDateString('ar-SA', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
