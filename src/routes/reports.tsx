import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getAuthHeaders } from '@/store/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

export const Route = createFileRoute('/reports')({
  component: Reports,
})

function Reports() {
  const [loading, setLoading] = useState(false)

  const exportToExcel = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/ledger`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to fetch ledger data')
      const data = await res.json()

      if (data.length === 0) {
        toast.error('No financial data available to export.')
        return
      }

      // Prepare data for Excel
      const worksheetData = data.map((item: any) => ({
        'Date': item.entryDate,
        'Day of Week': item.dayOfWeek,
        'Cash Earned': parseFloat(item.cashEarned),
        'Online Earned': parseFloat(item.onlineEarned),
        'Spent on Orders': parseFloat(item.spentOnOrders),
        'Pending Amount': parseFloat(item.pendingAmount),
        'Last Updated': new Date(item.updatedAt).toLocaleString()
      }))

      const ws = XLSX.utils.json_to_sheet(worksheetData)
      
      // Style the header row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1')
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1'
        if (!ws[address]) continue
        ws[address].s = { font: { bold: true } }
      }

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Financial_Ledger')
      
      // Generate and download
      const dateStr = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `RGRx_Financials_${dateStr}.xlsx`)
      toast.success('Excel file downloaded successfully.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-10">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-primary tracking-tight">Financial Reports</h2>
        <p className="text-muted-foreground">Download your complete financial ledger history.</p>
      </div>

      <Card className="border-border shadow-sm bg-card mt-8 max-w-md mx-auto">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-emerald-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
            <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-xl">Export Ledger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-sm text-muted-foreground">
            Generate an Excel (.xlsx) file containing all daily financial records, including cash flow, online earnings, and expenses.
          </p>
          <Button 
            className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700 text-white" 
            onClick={exportToExcel} 
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
            ) : (
              <><Download className="mr-2 h-5 w-5" /> Download Full Financial Report (.xlsx)</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
