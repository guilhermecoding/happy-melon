import { Metadata } from 'next'
import { StaffShell } from './_components/staff-shell'

export const metadata: Metadata = {
  title: {
    default: 'Happy Melon (Colaborador)',
    template: '%s | Happy Melon (Colaborador)',
  },
}

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <StaffShell>{children}</StaffShell>
}
