import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono, Plus_Jakarta_Sans, Spectral } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/components/providers/app-provider';
import { AppShell } from '@/components/layout/app-shell';
import { ToastContainer } from '@/components/ui/toast-container';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display-face',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-face',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-face',
  display: 'swap',
});

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-hero-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cadence — AI Voice Agent Platform',
  description:
    'Create, train, and manage AI voice agents for automated customer phone conversations.',
  openGraph: {
    title: 'Cadence — AI Voice Agent Platform',
    description:
      'Create, train, and manage AI voice agents for automated customer phone conversations.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cadence — AI Voice Agent Platform',
    description:
      'Create, train, and manage AI voice agents for automated customer phone conversations.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${spectral.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-white font-sans text-neutral-900 antialiased"
        suppressHydrationWarning
      >
        <AppProvider>
          <AppShell>{children}</AppShell>
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}
