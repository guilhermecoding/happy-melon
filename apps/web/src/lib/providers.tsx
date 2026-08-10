import { TooltipProvider } from '@/components/pouf/controls'
import { Toaster } from '@/components/pouf/toaster'
import React from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TooltipProvider>{children}</TooltipProvider>
      <div className="pouf-toasts">
        <Toaster />
      </div>
    </>
  )
}
