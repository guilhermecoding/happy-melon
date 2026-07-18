import type { Metadata } from 'next';
import './globals.css';
import { Cause, Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const cause = Cause({
  subsets: ['latin'],
  variable: '--font-cause',
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
    <html lang="pt-BR" className={cn("font-sans", inter.variable, cause.variable)}>
      <body>{children}</body>
    </html>
  );
}
