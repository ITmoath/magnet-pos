'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  ListTodo,
} from 'lucide-react'
import {
  useBranchTasksStore,
  BRANCH_TASK_DEFINITIONS,
  deadlineDateForTask,
  formatDeadlineAr,
  periodKeyForTask,
  type BranchTaskDef,
} from '@/store/useBranchTasksStore'
import { localDateKey } from '@/store/useAttendanceStore'

const REC_LABEL: Record<BranchTaskDef['recurrence'], string> = {
  daily: 'يومية',
  weekly: 'أسبوعية',
  monthly: 'شهرية',
  adhoc: 'غير دورية',
}

const REC_SORT: Record<BranchTaskDef['recurrence'], number> = {
  daily: 0,
  weekly: 1,
  monthly: 2,
  adhoc: 3,
}

type MainFilter = 'all' | 'adhoc' | 'periodic'
type PeriodicSub = 'all' | 'daily' | 'weekly' | 'monthly'

function completionKey(taskId: string, periodKey: string) {
  return `${taskId}:${periodKey}`
}

function filterTaskList(main: MainFilter, periodicSub: PeriodicSub): BranchTaskDef[] {
  let list = [...BRANCH_TASK_DEFINITIONS]
  if (main === 'adhoc') {
    list = list.filter((t) => t.recurrence === 'adhoc')
  } else if (main === 'periodic') {
    list = list.filter((t) => t.recurrence !== 'adhoc')
    if (periodicSub !== 'all') {
      list = list.filter((t) => t.recurrence === periodicSub)
    }
  }
  return list.sort((a, b) => REC_SORT[a.recurrence] - REC_SORT[b.recurrence])
}

export default function BranchTasksPage() {
  const [mainFilter, setMainFilter] = useState<MainFilter>('all')
  const [periodicSub, setPeriodicSub] = useState<PeriodicSub>('all')

  const completions = useBranchTasksStore((s) => s.completions)
  const toggleTaskComplete = useBranchTasksStore((s) => s.toggleTaskComplete)
  const now = new Date()
  const today = localDateKey(now)

  const visible = useMemo(
    () => filterTaskList(mainFilter, periodicSub),
    [mainFilter, periodicSub]
  )

  const filterKey = `${mainFilter}-${periodicSub}`

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col" dir="rtl">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-[#24275D] text-white shadow-lg flex-shrink-0"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <ListTodo className="w-5 h-5" />
          </div>
          <h1 className="text-base sm:text-lg font-bold truncate">المهام</h1>
        </div>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Link
            href="/pos"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-sm font-bold shrink-0"
          >
            <span className="hidden sm:inline">العودة للكاشير</span>
            <span className="sm:hidden text-xs">رجوع</span>
            <ArrowRight className="w-4 h-4 shrink-0 opacity-90" />
          </Link>
        </motion.div>
      </motion.header>

      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 space-y-3">
        <div className="flex flex-wrap gap-2 justify-start">
          <FilterChip
            label="الكل"
            active={mainFilter === 'all'}
            onClick={() => {
              setMainFilter('all')
              setPeriodicSub('all')
            }}
          />
          <FilterChip
            label="دورية"
            active={mainFilter === 'periodic'}
            onClick={() => {
              setMainFilter('periodic')
              setPeriodicSub('all')
            }}
          />
          <FilterChip
            label="غير دورية"
            active={mainFilter === 'adhoc'}
            onClick={() => {
              setMainFilter('adhoc')
              setPeriodicSub('all')
            }}
          />
        </div>

        <AnimatePresence initial={false}>
          {mainFilter === 'periodic' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 self-center ml-1">نوع الدورة:</span>
                <FilterChip
                  label="الكل"
                  active={periodicSub === 'all'}
                  onClick={() => setPeriodicSub('all')}
                  small
                />
                <FilterChip
                  label="يومية"
                  active={periodicSub === 'daily'}
                  onClick={() => setPeriodicSub('daily')}
                  small
                />
                <FilterChip
                  label="أسبوعية"
                  active={periodicSub === 'weekly'}
                  onClick={() => setPeriodicSub('weekly')}
                  small
                />
                <FilterChip
                  label="شهرية"
                  active={periodicSub === 'monthly'}
                  onClick={() => setPeriodicSub('monthly')}
                  small
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full">
        <AnimatePresence mode="popLayout">
          <motion.ul
            key={filterKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="space-y-3"
          >
            {visible.length === 0 ? (
              <li className="text-center text-gray-400 text-sm py-12">لا توجد مهام ضمن هذا التصفية.</li>
            ) : (
              visible.map((task, i) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  completions={completions}
                  toggleTaskComplete={toggleTaskComplete}
                  now={now}
                  today={today}
                  index={i}
                />
              ))
            )}
          </motion.ul>
        </AnimatePresence>
      </main>
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
  small,
}: {
  label: string
  active: boolean
  onClick: () => void
  small?: boolean
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={[
        'rounded-xl font-bold transition-colors border',
        small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
        active
          ? 'bg-[#24275D] text-white border-[#24275D] shadow-md shadow-[#24275D]/20'
          : 'bg-white text-gray-700 border-gray-200 hover:border-[#24275D]/35',
      ].join(' ')}
    >
      {label}
    </motion.button>
  )
}

function TaskRow({
  task,
  completions,
  toggleTaskComplete,
  now,
  today,
  index,
}: {
  task: BranchTaskDef
  completions: Record<string, boolean>
  toggleTaskComplete: (id: string) => void
  now: Date
  today: string
  index: number
}) {
  const pk = periodKeyForTask(task, now)
  const key = completionKey(task.id, pk)
  const done = !!completions[key]
  const deadline = deadlineDateForTask(task, now)
  const overdue = task.recurrence === 'adhoc' && !done && deadline < today

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28, delay: index * 0.03 }}
      className={[
        'rounded-2xl border bg-white p-4 shadow-sm transition-colors',
        done ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200',
        overdue ? 'border-[#D22128]/40 ring-1 ring-[#D22128]/15' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => toggleTaskComplete(task.id)}
          className="shrink-0 mt-0.5 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={done ? 'إلغاء الإكمال' : 'تسجيل الإكمال'}
        >
          {done ? (
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          ) : (
            <Circle className="w-7 h-7 text-gray-300" strokeWidth={2} />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 gap-y-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#24275D]/10 text-[#24275D]">
              {REC_LABEL[task.recurrence]}
            </span>
            {overdue && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D22128] text-white">
                متأخرة
              </span>
            )}
          </div>
          <h2
            className={`font-bold text-base mt-2 leading-snug ${
              done ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}
          >
            {task.title}
          </h2>
          {task.description && (
            <p className="text-sm text-gray-500 mt-1 leading-snug line-clamp-2">{task.description}</p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
            <CalendarClock className="w-4 h-4 shrink-0 text-[#D22128]" />
            <span className="font-mono tabular-nums">{formatDeadlineAr(deadline)}</span>
            <span className="text-gray-400">({deadline})</span>
          </div>
        </div>
      </div>
    </motion.li>
  )
}
