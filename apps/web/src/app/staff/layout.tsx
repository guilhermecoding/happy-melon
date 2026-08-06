import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: 'Happy Melon (Colaborador)',
        template: '%s | Happy Melon (Colaborador)',
    }
}

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <div>{children}</div>
}