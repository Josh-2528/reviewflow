'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { BrandingSettings } from '@/lib/types'

const defaults: BrandingSettings = {
  app_name: 'ReviewFlow',
  logo_url: null,
  primary_color: '#2563eb',
}

const BrandingContext = createContext<BrandingSettings>(defaults)

export function useBranding() {
  return useContext(BrandingContext)
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(defaults)

  useEffect(() => {
    fetch('/api/admin/branding')
      .then((r) => r.json())
      .then((data) => {
        setBranding({
          app_name: data.app_name || defaults.app_name,
          logo_url: data.logo_url || null,
          primary_color: data.primary_color || defaults.primary_color,
        })
        // Inject primary color as CSS custom property
        document.documentElement.style.setProperty(
          '--color-brand',
          data.primary_color || defaults.primary_color
        )
      })
      .catch(() => {})
  }, [])

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  )
}
