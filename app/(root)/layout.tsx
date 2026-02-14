import Bottombar from '@/components/Bottombar'
import Topbar from '@/components/Topbar'
import ThemeProvider from '@/providers/ThemeProvider'
import React, { ReactNode } from 'react'
import { Toaster } from 'sonner'

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
    <div className="w-full min-h-screen bg-background overflow-x-hidden">
        <Toaster />
        <Topbar />
          <div className="mt-24">
              {children}
          </div>

        <Bottombar />
    </div>
    </ThemeProvider>
  )
}

export default RootLayout