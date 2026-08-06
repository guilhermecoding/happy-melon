import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import '@/components/pouf/pouf.css';
import { cn } from '@/lib/utils';
import Providers from '@/lib/providers';

const cause = localFont({
  src: '../fonts/cause-latin-wght-normal.woff2',
  variable: '--font-cause',
  weight: '100 900',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
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
    <html lang="pt-BR" className={cn('font-sans', cause.variable, spaceGrotesk.variable)}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
