import Bottombar from '@/components/Bottombar'
import Topbar from '@/components/Topbar'
import React, { ReactNode } from 'react'
import { Toaster } from 'sonner'

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full min-h-screen bg-[#FFF9F9] overflow-x-hidden">
        <Toaster />
        <Topbar />
        <div className="mt-24">
          {children}
        </div>

        <Bottombar />
    </div>
  )
}

export default RootLayout