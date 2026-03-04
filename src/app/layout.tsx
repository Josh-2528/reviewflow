import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { BrandingProvider } from '@/components/branding-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ReviewFlow - AI-Powered Review Management',
  description: 'Never miss a review. Auto-generate perfect replies. Save hours every week.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BrandingProvider>
          {children}
        </BrandingProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
