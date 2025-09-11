import './globals.css';
import type { Metadata } from 'next';
import ConditionalLayout from '@/components/ConditionalLayout';
import { GlobalAcademicContextProvider } from '@/contexts/GlobalAcademicContext';
import { ToastProvider } from '@/components/ui/notifications';

export const metadata: Metadata = {
  title: 'Yano School',
  description: 'Official website for Yano School – Programs, Admissions, About, Contact, and more.',
  keywords: 'Yano School, Nigeria, Education, Programs, Admissions, Contact, Events',
  authors: [{ name: 'David obonyano', url: 'mailto:godsentryan@gmail.com' }],
  metadataBase: new URL('https://yanoschoolll.vercel.app'), // 👈 Add this
  openGraph: {
    title: 'Yano School',
    description: 'Empowering students through quality education and innovation.',
    url: 'https://yanoschoolll.vercel.app/',
    siteName: 'Yano School',
    images: [
      {
        url: '/images/hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Yano School Hero Image',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/yano-logo.png" type="image/png" />
      </head>
      <body>
        <GlobalAcademicContextProvider>
          <ToastProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </ToastProvider>
        </GlobalAcademicContextProvider>
      </body>
    </html>
  );
}
