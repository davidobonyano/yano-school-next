import { AuthProvider } from '@/components/auth/AuthProvider'
import PortalNav from '@/components/portal/PortalNav'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <PortalNav />
        <main className="pt-16">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}