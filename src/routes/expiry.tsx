import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getAuthHeaders } from '@/store/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { differenceInDays, parseISO, isBefore, startOfDay } from 'date-fns'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/lib/api'

export const Route = createFileRoute('/expiry')({
  component: Expiry,
})

type ExpiryItem = {
  id: number;
  itemName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  createdAt: string;
}

function Expiry() {
  const [items, setItems] = useState<ExpiryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'EXPIRED' | 'SOON' | 'SAFE'>('ALL')
  
  const [itemName, setItemName] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [quantity, setQuantity] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchItems = () => {
    setLoading(true)
    fetch(`${API_BASE_URL}/api/expiry/manual`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setItems(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName || !batchNumber || !expiryDate || !quantity) {
      toast.error('Please fill all fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/expiry/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          itemName,
          batchNumber,
          quantity: parseInt(quantity, 10),
          expiryDate
        })
      })
      if (res.ok) {
        toast.success('Batch added to tracker')
        setItemName('')
        setBatchNumber('')
        setQuantity('')
        setExpiryDate('')
        fetchItems()
      } else {
        toast.error('Failed to add batch')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error adding batch')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/expiry/manual/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      if (res.ok) {
        toast.success('Batch deleted')
        setItems(items.filter(item => item.id !== id))
      }
    } catch (err) {
      console.error(err)
      toast.error('Error deleting batch')
    }
  }

  const getStatus = (expiryString: string) => {
    const today = startOfDay(new Date())
    const expiry = parseISO(expiryString)
    
    if (isBefore(expiry, today)) return 'EXPIRED'
    
    const daysLeft = differenceInDays(expiry, today)
    if (daysLeft <= 60) return 'SOON'
    
    return 'SAFE'
  }

  const filteredItems = items.filter(item => {
    if (filter === 'ALL') return true
    return getStatus(item.expiryDate) === filter
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Manual Expiry Tracker</h2>
          <p className="text-muted-foreground mt-1">Log and monitor batches directly.</p>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-lg">Add New Batch</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2 col-span-2">
              <Label>Item Name</Label>
              <Input 
                value={itemName} 
                onChange={(e) => setItemName(e.target.value)} 
                placeholder="e.g. Paracetamol 500mg" 
              />
            </div>
            <div className="space-y-2">
              <Label>Batch Number</Label>
              <Input 
                value={batchNumber} 
                onChange={(e) => setBatchNumber(e.target.value)} 
                placeholder="BATCH-123" 
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input 
                type="number"
                min="1"
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)} 
                placeholder="Qty" 
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input 
                type="date"
                value={expiryDate} 
                onChange={(e) => setExpiryDate(e.target.value)} 
              />
            </div>
            <div className="col-span-1 md:col-span-5 flex justify-end mt-2">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Batch
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <div className="flex gap-2 bg-card p-1 rounded-md border border-border shadow-sm">
          {(['ALL', 'EXPIRED', 'SOON', 'SAFE'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === f 
                  ? 'bg-primary text-primary-foreground shadow' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {f === 'ALL' ? 'All Batches' : 
               f === 'EXPIRED' ? 'Expired' : 
               f === 'SOON' ? 'Expiring Soon' : 'Safe'}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Batch No.</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                      No batches found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map(item => {
                    const status = getStatus(item.expiryDate)
                    
                    let badgeProps = { className: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
                    let rowClass = ''
                    let statusText = 'Safe'
                    
                    if (status === 'EXPIRED') {
                      badgeProps = { className: 'bg-destructive/20 text-destructive border-destructive/30' }
                      rowClass = 'bg-destructive/5 hover:bg-destructive/10'
                      statusText = 'Expired'
                    } else if (status === 'SOON') {
                      badgeProps = { className: 'bg-amber-100 text-amber-800 border-amber-200' }
                      rowClass = 'bg-amber-500/5 hover:bg-amber-500/10'
                      statusText = 'Expiring Soon'
                    }

                    return (
                      <TableRow key={item.id} className={`transition-colors ${rowClass}`}>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{item.batchNumber}</TableCell>
                        <TableCell>{new Date(item.expiryDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={badgeProps.className}>
                            {statusText}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
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
