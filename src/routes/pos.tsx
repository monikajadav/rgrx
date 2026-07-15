import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Printer, Trash2, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { clsx } from 'clsx'

export const Route = createFileRoute('/pos')({
  component: POS,
})

type BillItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  cgst: number;
  sgst: number;
}

function POS() {
  const [items, setItems] = useState<BillItem[]>([])
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [price, setPrice] = useState('')
  
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [customerPhone, setCustomerPhone] = useState('')
  
  const inputRef = useRef<HTMLInputElement>(null)

  const handleWhatsAppShare = () => {
    if (!customerPhone) {
      toast.error('Please enter customer phone number');
      return;
    }
    
    let text = `*RGRx Pharmacy Receipt*\n\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    text += `------------------------\n`;
    items.forEach(item => {
      text += `${item.name} x${item.quantity} - Rs.${item.total.toFixed(2)}\n`;
    });
    text += `------------------------\n`;
    text += `*Total: Rs.${grandTotal.toFixed(2)}*\n\n`;
    text += `Thank you for shopping with us! Get Well Soon.`;

    const phone = customerPhone.replace(/\D/g, '');
    const finalPhone = phone.length === 10 ? `91${phone}` : phone;
    const encodedText = encodeURIComponent(text);
    
    window.open(`https://wa.me/${finalPhone}?text=${encodedText}`, '_blank');
    
    toast.success('WhatsApp opened!');
    setShowPrintModal(false);
    clearBill();
    setCustomerPhone('');
  };

  // Calculations
  const subTotal = items.reduce((sum, item) => sum + (item.total - item.cgst - item.sgst), 0)
  const totalCgst = items.reduce((sum, item) => sum + item.cgst, 0)
  const totalSgst = items.reduce((sum, item) => sum + item.sgst, 0)
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0)

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!itemName || !quantity || !price) {
      toast.error('Please fill all fields');
      return;
    }
    
    const qty = parseInt(quantity, 10);
    const prc = parseFloat(price);
    if (isNaN(qty) || isNaN(prc) || qty <= 0 || prc <= 0) {
      toast.error('Invalid quantity or price');
      return;
    }

    const total = qty * prc;
    // Assuming 18% total GST (9% CGST, 9% SGST) applied to the base price
    // Base price = total / 1.18
    const basePrice = total / 1.18;
    const cgst = basePrice * 0.09;
    const sgst = basePrice * 0.09;

    const newItem: BillItem = {
      id: Math.random().toString(36).substring(7),
      name: itemName,
      quantity: qty,
      price: prc,
      total,
      cgst,
      sgst
    };

    setItems([...items, newItem]);
    setItemName('');
    setQuantity('1');
    setPrice('');
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty === 0) return null;
        
        const total = newQty * item.price;
        const basePrice = total / 1.18;
        return {
          ...item,
          quantity: newQty,
          total,
          cgst: basePrice * 0.09,
          sgst: basePrice * 0.09
        };
      }
      return item;
    }).filter(Boolean) as BillItem[]);
  }

  const clearBill = () => {
    setItems([]);
    setItemName('');
    setQuantity('1');
    setPrice('');
    setSelectedRowIndex(0);
    setCustomerPhone('');
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'F4') {
        e.preventDefault();
        setShowPrintModal(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearBill();
        toast.info('Bill Cleared');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedRowIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedRowIndex(prev => Math.min(items.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (items[selectedRowIndex]) {
          updateQuantity(items[selectedRowIndex].id, -1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (items[selectedRowIndex]) {
          updateQuantity(items[selectedRowIndex].id, 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedRowIndex]);

  return (
    <div className="flex flex-col gap-6 h-full relative">
      <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Item Name</label>
          <Input 
            ref={inputRef}
            placeholder="e.g. Paracetamol" 
            value={itemName} 
            onChange={e => setItemName(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAddItem()}
          />
        </div>
        <div className="w-24 space-y-2">
          <label className="text-sm font-medium">Qty</label>
          <Input 
            type="number" 
            min="1" 
            value={quantity} 
            onChange={e => setQuantity(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAddItem()}
          />
        </div>
        <div className="w-32 space-y-2">
          <label className="text-sm font-medium">Price (₹)</label>
          <Input 
            type="number" 
            min="0" 
            step="0.01"
            placeholder="0.00" 
            value={price} 
            onChange={e => setPrice(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAddItem()}
          />
        </div>
        <Button onClick={handleAddItem} className="h-10">Add Item</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Left side: Bill Items Table */}
        <div className="flex-1 bg-card rounded-lg border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-primary" size={20} />
              <h3 className="font-semibold text-lg">Current Bill</h3>
            </div>
            <div className="text-sm text-muted-foreground">
              {items.length} Items
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[50%]">Item Name</TableHead>
                  <TableHead className="text-center w-[20%]">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-48 text-muted-foreground">
                      Add an item above to start billing.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow 
                      key={item.id}
                      className={clsx(
                        "transition-colors",
                        index === selectedRowIndex && "bg-primary/10 border-l-2 border-primary"
                      )}
                      onClick={() => setSelectedRowIndex(index)}
                    >
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6 rounded-full"
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1) }}
                          >
                            <Minus size={12} />
                          </Button>
                          <span className="w-6 text-center tabular-nums font-semibold">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6 rounded-full"
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1) }}
                          >
                            <Plus size={12} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">₹{item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-primary">₹{item.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={(e) => {
                          e.stopPropagation()
                          setItems(items.filter(i => i.id !== item.id))
                        }}>
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right side: Bill Summary */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          <Card className="shadow-md border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums font-medium">₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CGST (9%)</span>
                <span className="tabular-nums font-medium">₹{totalCgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SGST (9%)</span>
                <span className="tabular-nums font-medium">₹{totalSgst.toFixed(2)}</span>
              </div>
              
              <div className="pt-4 border-t border-border flex justify-between items-end">
                <span className="text-lg font-bold">Grand Total</span>
                <span className="text-3xl font-extrabold text-primary tabular-nums tracking-tight">₹{grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button 
              className="w-full h-12 text-lg font-bold shadow-lg" 
              size="lg"
              onClick={() => {
                if (items.length === 0) return toast.error('Bill is empty!');
                setShowPrintModal(true);
              }}
            >
              <Printer className="mr-2" /> Print Preview (F4)
            </Button>
            <Button 
              variant="destructive" 
              className="w-full h-12 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors" 
              size="lg"
              onClick={clearBill}
            >
              Clear Bill (Esc)
            </Button>
          </div>
        </div>
      </div>
      
      {/* Digital Receipt Modal Overlay */}
      {showPrintModal && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-2xl rounded-lg w-[400px] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-white text-black font-mono text-sm" id="receipt-content">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold font-sans">RGRx Pharmacy</h2>
                <p className="text-xs mt-1">123 Health Ave, Medical City</p>
                <p className="text-xs">GSTIN: 22AAAAA0000A1Z5</p>
              </div>
              
              <div className="border-t border-b border-dashed border-gray-300 py-2 mb-4 flex justify-between">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>Time: {new Date().toLocaleTimeString()}</span>
              </div>
              
              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b border-dashed border-gray-300 text-left">
                    <th className="pb-2 font-normal">Item</th>
                    <th className="pb-2 text-center font-normal">Qty</th>
                    <th className="pb-2 text-right font-normal">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="py-2 pr-2">
                        <div className="truncate w-40">{item.name}</div>
                      </td>
                      <td className="py-2 text-center align-top">{item.quantity}</td>
                      <td className="py-2 text-right align-top">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="border-t border-dashed border-gray-300 pt-4 space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>CGST</span>
                  <span>₹{totalCgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>SGST</span>
                  <span>₹{totalSgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t border-gray-300">
                  <span>TOTAL</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="text-center mt-8 text-xs text-gray-500">
                <p>Thank you for shopping with us!</p>
                <p>Get Well Soon</p>
              </div>
            </div>
            
            <div className="p-4 bg-muted border-t border-border flex flex-col gap-3">
              <div className="flex gap-2 items-center">
                <Input 
                  placeholder="Customer WhatsApp (10 digits)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleWhatsAppShare}>
                  WhatsApp
                </Button>
                <Button className="flex-1" onClick={() => {
                  window.print();
                }}>
                  Print / Save
                </Button>
                <Button variant="outline" onClick={() => setShowPrintModal(false)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
