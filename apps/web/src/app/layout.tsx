import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Space_Grotesk, Nunito } from 'next/font/google';
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

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-pouf',
  display: 'swap',
});

const APP_NAME = 'Happy Melon';

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} - Otimize a organização dos staffs na entrega de balões!`,
    template: '%s | ${APP_NAME}',
  },
  description: 'Otimize a organização dos staffs na entrega de balões durante Maratonas de Programação!',
  applicationName: APP_NAME,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"),
  authors: [{
    name: "Joao Guilherme",
    url: "https://www.linkedin.com/in/jo%C3%A3o-guilherme-ara%C3%BAjo-viana",
  }],
  openGraph: {
    title: `${APP_NAME} - Otimize a organização dos staffs na entrega de balões!`,
    description: "Otimize a organização dos staffs na entrega de balões durante Maratonas de Programação!",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: APP_NAME,
    images: [
      {
        url: "og-img.jpg",
      },
    ],
    locale: "pt-BR",
    type: "website",
  },
  keywords: ["happy-melon", "maratona-de-programacao", "staff", "baloes", "organizacao", "organizacao-de-staffs", "organizacao-de-baloes"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn('font-sans', cause.variable, spaceGrotesk.variable, nunito.variable)}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
