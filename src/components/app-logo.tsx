'use client'

import { MessageSquareText } from 'lucide-react'
import { useBranding } from '@/components/branding-provider'

export function AppLogo({
  size = 'default',
  showName = true,
}: {
  size?: 'small' | 'default' | 'large'
  showName?: boolean
}) {
  const { app_name, logo_url, primary_color } = useBranding()

  const iconSizes = {
    small: 'h-5 w-5',
    default: 'h-6 w-6',
    large: 'h-8 w-8',
  }

  const textSizes = {
    small: 'text-base',
    default: 'text-lg',
    large: 'text-2xl',
  }

  return (
    <span className="inline-flex items-center gap-2">
      {logo_url ? (
        <img
          src={logo_url}
          alt={app_name}
          className={`${iconSizes[size]} object-contain`}
        />
      ) : (
        <MessageSquareText
          className={iconSizes[size]}
          style={{ color: primary_color }}
        />
      )}
      {showName && (
        <span className={`font-bold text-gray-900 ${textSizes[size]}`}>
          {app_name}
        </span>
      )}
    </span>
  )
}
