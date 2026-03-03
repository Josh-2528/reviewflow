'use client'

interface StatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  new: {
    label: 'New',
    className: 'bg-blue-100 text-blue-700',
  },
  reply_generated: {
    label: 'Reply Ready',
    className: 'bg-amber-100 text-amber-700',
  },
  approved: {
    label: 'Approved',
    className: 'bg-blue-100 text-blue-700',
  },
  published: {
    label: 'Published',
    className: 'bg-green-100 text-green-700',
  },
  skipped: {
    label: 'Skipped',
    className: 'bg-gray-100 text-gray-500',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-500',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
