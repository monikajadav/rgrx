import { createRootRoute, Outlet, Link, useNavigate, useLocation } from '@tanstack/react-router'
import { useEffect } from 'react'
import { LayoutDashboard, ShoppingCart, Package, AlertTriangle, FileText, LogOut } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/useAuthStore'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { isAuthenticated, username, logout, loadFromStorage } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Load auth from localStorage on mount
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  // If not authenticated and not on public pages, redirect to login
  useEffect(() => {
    const isPublicPage = location.pathname === '/login'
    if (!isAuthenticated && !isPublicPage) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, location.pathname, navigate])

  // If on login page, render just the outlet (no admin layout)
  if (location.pathname === '/login') {
    return (
      <>
        <Outlet />
        <Toaster position="bottom-right" />
      </>
    )
  }

  // If not authenticated and trying to access an admin page, render nothing while redirecting
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col hidden md:flex">
        <div className="p-6 border-b border-border flex flex-col items-center justify-center">
          <img src="/logo.jpeg?v=2" alt="RGRx Logo" className="w-28 h-auto object-contain mb-2 rounded-lg" />
          <h1 className="text-xl font-bold text-primary tracking-tight">RGRx</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pharmacy POS</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem to="/pos" icon={<ShoppingCart size={20} />} label="POS / Billing" />
          <NavItem to="/expiry" icon={<AlertTriangle size={20} />} label="Expiry Tracker" />
          <NavItem to="/reports" icon={<FileText size={20} />} label="Reports" />
        </nav>
        {/* Logout button at the bottom of sidebar */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => { logout(); navigate({ to: '/login' }) }}
          >
            <LogOut size={18} className="mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center flex-1 max-w-2xl">
            {/* Header Content can go here */}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-muted-foreground">{username || 'Admin'}</div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <Outlet />
        </div>
      </main>

      {/* Toast Notifications */}
      <Toaster position="bottom-right" />
    </div>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors font-medium"
      activeProps={{
        className: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
