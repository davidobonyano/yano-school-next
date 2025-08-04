'use client';
export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout will automatically remove ClientLayout for ALL dashboard routes
  return <>{children}</>;
}