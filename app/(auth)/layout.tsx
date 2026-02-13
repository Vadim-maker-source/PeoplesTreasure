import React, { ReactNode } from 'react'
import { Toaster } from 'sonner'

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full max-h-screen overflow-x-hidden bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url("/images/SignBg.png")' }} >
        <Toaster />
        <div>
          {children}
        </div>

    </div>
  )
}

export default AuthLayout