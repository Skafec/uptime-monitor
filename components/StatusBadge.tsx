interface Props {
  status: 'up' | 'down' | 'unknown'
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const configs = {
    up: {
      label: 'Operational',
      classes: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    },
    down: {
      label: 'Down',
      classes: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    },
    unknown: {
      label: 'Unknown',
      classes: 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700',
    },
  }

  const config = configs[status]
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full ${sizeClass} ${config.classes}`}
    >
      {config.label}
    </span>
  )
}
