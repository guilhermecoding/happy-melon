import type { Metadata } from 'next';
import './globals.css';
import { Cause } from "next/font/google";
import { cn } from "@/lib/utils";

const cause = Cause({
  subsets: ['latin'],
  variable: '--font-sans',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: {
    default: 'Happy Melon - Otimize a organização dos staffs na entrega de balões!',
    template: '%s | Happy Melon',
  },
  description: 'Otimize a organização dos staffs na entrega de balões!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("font-sans", cause.variable)}>
      <body>{children}</body>
    </html>
  );
}
