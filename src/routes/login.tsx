import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/useAuthStore'
import { Lock, UserPlus, LogIn, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/lib/api'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null)
  const login = useAuthStore(s => s.login)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const navigate = useNavigate()

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  // Check if admin exists
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/status`)
      .then(r => r.json())
      .then(data => setHasAdmin(data.hasAdmin))
      .catch(() => setHasAdmin(false))
  }, [])

  const handleSetup = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success('Admin account created! You can now log in.')
      setHasAdmin(true)
      setPassword('')
    } catch (e: any) {
      toast.error(e.message || 'Setup failed')
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      login(data.token, data.username)
      toast.success('Welcome back!')
      navigate({ to: '/' })
    } catch (e: any) {
      toast.error(e.message || 'Login failed')
    }
    setLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (hasAdmin) {
      handleLogin()
    } else {
      handleSetup()
    }
  }

  if (hasAdmin === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <img src="/logo.jpeg?v=2" alt="RGRx Logo" className="w-28 h-auto rounded-xl shadow-lg" />
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">RGRx</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pharmacy Management</p>
          </div>
        </div>

        <Card className="shadow-xl border-border">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              {hasAdmin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              {hasAdmin ? 'Admin Login' : 'Set Up Admin Account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={hasAdmin ? 'Enter password' : 'Create a password (min 4 chars)'}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading || !password}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                {hasAdmin ? 'Sign In' : 'Create Admin & Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
