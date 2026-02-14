import React, { ReactNode } from 'react'
import { Toaster } from 'sonner'
import ThemeProvider from '@/providers/ThemeProvider'

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
    <div className="w-full max-h-screen overflow-x-hidden bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url("/images/SignBg.png")' }} >
        <Toaster />
        <div>
          {children}
        </div>

    </div>
    </ThemeProvider>
  )
}

export default AuthLayout