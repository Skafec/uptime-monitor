import { groupChecksByDay } from '@/lib/monitor'

interface Check {
  checked_at: string
  status: 'up' | 'down'
}

interface Props {
  checks: Check[]
  days?: number
}

export default function UptimeChart({ checks, days = 90 }: Props) {
  const grouped = groupChecksByDay(checks, days)

  return (
    <div>
      <div className="flex items-end gap-px h-10">
        {grouped.map((day) => {
          let bgClass: string
          let title: string

          if (day.total === 0) {
            bgClass = 'bg-gray-100 dark:bg-slate-800'
            title = `${day.date}: No data`
          } else if (day.uptime >= 100) {
            bgClass = 'bg-green-400'
            title = `${day.date}: 100% uptime`
          } else if (day.uptime >= 90) {
            bgClass = 'bg-yellow-400'
            title = `${day.date}: ${day.uptime}% uptime`
          } else {
            bgClass = 'bg-red-400'
            title = `${day.date}: ${day.uptime}% uptime (${day.total - day.up} failed)`
          }

          return (
            <div
              key={day.date}
              className={`flex-1 rounded-sm cursor-default transition-opacity hover:opacity-75 ${bgClass}`}
              style={{ height: day.total === 0 ? '40%' : '100%' }}
              title={title}
            />
          )
        })}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-gray-400 dark:text-slate-500">90 days ago</span>
        <span className="text-xs text-gray-400 dark:text-slate-500">Today</span>
      </div>
    </div>
  )
}
