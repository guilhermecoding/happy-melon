import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toast'
import React from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Toaster>
      <TooltipProvider>{children}</TooltipProvider>
    </Toaster>
  )
}
