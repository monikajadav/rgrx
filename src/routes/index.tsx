import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IndianRupee, Smartphone, ShoppingBag, Clock, Loader2, Save, Download, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/store/useAuthStore'
import * as XLSX from 'xlsx'
import { API_BASE_URL } from '@/lib/api'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

type LedgerEntry = {
  id: number;
  entryDate: string;
  dayOfWeek: string;
  cashEarned: string;
  onlineEarned: string;
  spentOnOrders: string;
  pendingAmount: string;
  updatedAt: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function Dashboard() {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayDay = DAYS[today.getDay()]

  const [entryDate, setEntryDate] = useState(todayStr)
  const [dayOfWeek, setDayOfWeek] = useState(todayDay)
  const [cashEarned, setCashEarned] = useState('')
  const [onlineEarned, setOnlineEarned] = useState('')
  const [spentOnOrders, setSpentOnOrders] = useState('')
  const [pendingAmount, setPendingAmount] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  // Today's dashboard stats
  const [todayStats, setTodayStats] = useState({
    cashEarned: '0.00', onlineEarned: '0.00', spentOnOrders: '0.00', pendingAmount: '0.00'
  })

  const fetchLedger = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ledger`, { headers: getAuthHeaders() })
      if (res.status === 401) return
      const data = await res.json()
      setEntries(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setTodayStats(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchLedger()
    fetchDashboard()
  }, [])

  // Update day of week when date changes
  useEffect(() => {
    if (entryDate) {
      const d = new Date(entryDate + 'T00:00:00')
      setDayOfWeek(DAYS[d.getDay()])
    }
  }, [entryDate])

  const handleSave = async () => {
    if (!cashEarned && !onlineEarned && !spentOnOrders && !pendingAmount) {
      toast.error('Please fill at least one field')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/ledger`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          entryDate,
          dayOfWeek,
          cashEarned: cashEarned || '0',
          onlineEarned: onlineEarned || '0',
          spentOnOrders: spentOnOrders || '0',
          pendingAmount: pendingAmount || '0',
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      toast.success(data.updated ? 'Entry updated!' : 'Entry saved!')
      
      // Reset form
      setEntryDate(todayStr)
      setDayOfWeek(todayDay)
      setCashEarned('')
      setOnlineEarned('')
      setSpentOnOrders('')
      setPendingAmount('')
      setEditingId(null)

      fetchLedger()
      fetchDashboard()
    } catch (e) {
      toast.error('Error saving entry')
    }
    setSaving(false)
  }

  const handleEdit = (entry: LedgerEntry) => {
    setEntryDate(entry.entryDate)
    setDayOfWeek(entry.dayOfWeek)
    setCashEarned(entry.cashEarned)
    setOnlineEarned(entry.onlineEarned)
    setSpentOnOrders(entry.spentOnOrders)
    setPendingAmount(entry.pendingAmount)
    setEditingId(entry.id)
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.info(`Editing entry for ${entry.entryDate} (${entry.dayOfWeek})`)
  }

  const handleExportExcel = () => {
    const worksheetData = entries.map(e => ({
      'Date': e.entryDate,
      'Day': e.dayOfWeek,
      'Cash Earned (₹)': parseFloat(e.cashEarned),
      'Online/UPI Earned (₹)': parseFloat(e.onlineEarned),
      'Spent on Orders (₹)': parseFloat(e.spentOnOrders),
      'Pending Amount (₹)': parseFloat(e.pendingAmount),
      'Net Earning (₹)': parseFloat(e.cashEarned) + parseFloat(e.onlineEarned) - parseFloat(e.spentOnOrders),
    }))

    const ws = XLSX.utils.json_to_sheet(worksheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Daily_Financials')
    XLSX.writeFile(wb, `RGRx_Ledger_${todayStr}.xlsx`)
    toast.success('Excel file downloaded!')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Daily Ledger</h2>
          <p className="text-muted-foreground mt-1">Manually track your daily financial metrics.</p>
        </div>
        <Button onClick={handleExportExcel} variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50">
          <Download className="mr-2 h-4 w-4" /> Export to Excel
        </Button>
      </div>

      {/* Today's Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cash Earned</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{parseFloat(todayStats.cashEarned).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Today's cash collection</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">UPI / Online</CardTitle>
            <Smartphone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{parseFloat(todayStats.onlineEarned).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Today's digital payments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Spent on Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">₹{parseFloat(todayStats.spentOnOrders).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Money spent on purchases</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₹{parseFloat(todayStats.pendingAmount).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Amount pending to pay</p>
          </CardContent>
        </Card>
      </div>

      {/* Manual Entry Form */}
      <Card className="shadow-sm border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            {editingId ? `Editing Entry for ${entryDate}` : "Add Today's Entry"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Day</label>
              <Input value={dayOfWeek} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cash Earned (₹)</label>
              <Input type="number" step="0.01" placeholder="0.00" value={cashEarned} onChange={(e) => setCashEarned(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">UPI / Online (₹)</label>
              <Input type="number" step="0.01" placeholder="0.00" value={onlineEarned} onChange={(e) => setOnlineEarned(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Spent on Orders (₹)</label>
              <Input type="number" step="0.01" placeholder="0.00" value={spentOnOrders} onChange={(e) => setSpentOnOrders(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pending Amount (₹)</label>
              <Input type="number" step="0.01" placeholder="0.00" value={pendingAmount} onChange={(e) => setPendingAmount(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={handleSave} disabled={saving} className="px-8">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {editingId ? 'Update Entry' : 'Save Entry'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={() => {
                setEditingId(null)
                setEntryDate(todayStr)
                setDayOfWeek(todayDay)
                setCashEarned('')
                setOnlineEarned('')
                setSpentOnOrders('')
                setPendingAmount('')
              }}>
                Cancel Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historical Ledger Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Historical Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead className="text-right">Cash (₹)</TableHead>
                  <TableHead className="text-right">Online (₹)</TableHead>
                  <TableHead className="text-right">Spent (₹)</TableHead>
                  <TableHead className="text-right">Pending (₹)</TableHead>
                  <TableHead className="text-right">Net (₹)</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                      No entries yet. Add your first daily entry above!
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => {
                    const net = parseFloat(entry.cashEarned) + parseFloat(entry.onlineEarned) - parseFloat(entry.spentOnOrders)
                    return (
                      <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{entry.entryDate}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.dayOfWeek}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-emerald-600">
                          ₹{parseFloat(entry.cashEarned).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-blue-600">
                          ₹{parseFloat(entry.onlineEarned).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-amber-600">
                          ₹{parseFloat(entry.spentOnOrders).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-destructive">
                          ₹{parseFloat(entry.pendingAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right tabular-nums font-bold ${net >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                          ₹{net.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)} className="text-primary hover:bg-primary/10">
                            <Pencil className="h-4 w-4 mr-1" /> Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
