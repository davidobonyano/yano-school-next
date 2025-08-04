'use client';

import { usePathname } from 'next/navigation';
import ClientLayout from './ClientLayout';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  if (isDashboard) {
    return <>{children}</>;
  }

  return <ClientLayout>{children}</ClientLayout>;
}
