import { create } from 'zustand';
import type { SearchResult } from './useSearchStore';

export interface BillItem {
  id: string; // unique frontend ID
  productId: number;
  batchId: number;
  name: string;
  batchNumber: string;
  quantity: number;
  mrp: string;
  cgstAmount: string;
  sgstAmount: string;
  totalPrice: string;
}

interface POSState {
  currentBill: BillItem[];
  addItem: (product: SearchResult, qty?: number) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearBill: () => void;
}

export const usePOSStore = create<POSState>((set) => ({
  currentBill: [],
  
  addItem: (product, qty = 1) => {
    set((state) => {
      // Find remaining batches for FEFO
      const remainingBatches = product.batches.map(b => {
        // Subtract what's already in the bill for this batch
        const alreadyInBill = state.currentBill
          .filter(item => item.batchId === b.id)
          .reduce((sum, item) => sum + item.quantity, 0);
        return { ...b, available: b.quantity - alreadyInBill };
      }).filter(b => b.available > 0);

      let quantityToFulfill = qty;
      const newItems: BillItem[] = [];

      for (const batch of remainingBatches) {
        if (quantityToFulfill <= 0) break;

        const qtyTaken = Math.min(batch.available, quantityToFulfill);
        quantityToFulfill -= qtyTaken;

        const mrpNum = parseFloat(batch.mrp);
        const cgstRate = parseFloat(product.cgstRate || '0');
        const sgstRate = parseFloat(product.sgstRate || '0');
        
        // Basic tax calculation based on MRP (simplified for POS)
        // Usually MRP is inclusive of tax, but for this exercise we calculate tax on the base price 
        // Base Price = MRP / (1 + (CGST% + SGST%) / 100)
        const totalTaxRate = (cgstRate + sgstRate) / 100;
        const basePrice = mrpNum / (1 + totalTaxRate);
        const cgstAmount = basePrice * (cgstRate / 100) * qtyTaken;
        const sgstAmount = basePrice * (sgstRate / 100) * qtyTaken;
        const totalPrice = mrpNum * qtyTaken;

        // Check if we can just merge with an existing bill item for the same batch
        const existingItemIndex = state.currentBill.findIndex(i => i.batchId === batch.id);

        if (existingItemIndex >= 0) {
          // It's easier to just recreate the state array
          const existingItem = state.currentBill[existingItemIndex];
          const newQty = existingItem.quantity + qtyTaken;
          const newBasePrice = mrpNum / (1 + totalTaxRate);
          const newCgst = newBasePrice * (cgstRate / 100) * newQty;
          const newSgst = newBasePrice * (sgstRate / 100) * newQty;
          const newTotal = mrpNum * newQty;

          const updatedBill = [...state.currentBill];
          updatedBill[existingItemIndex] = {
            ...existingItem,
            quantity: newQty,
            cgstAmount: newCgst.toFixed(2),
            sgstAmount: newSgst.toFixed(2),
            totalPrice: newTotal.toFixed(2)
          };
          
          return { currentBill: updatedBill };
        } else {
          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            productId: product.id,
            batchId: batch.id,
            name: product.name,
            batchNumber: batch.batchNumber,
            quantity: qtyTaken,
            mrp: batch.mrp,
            cgstAmount: cgstAmount.toFixed(2),
            sgstAmount: sgstAmount.toFixed(2),
            totalPrice: totalPrice.toFixed(2)
          });
        }
      }

      if (quantityToFulfill > 0) {
        // We couldn't fulfill the entire quantity (out of stock)
        console.warn('Not enough stock to fulfill entirely!');
      }

      return { currentBill: [...state.currentBill, ...newItems] };
    });
  },
  
  updateQuantity: (itemId, delta) => {
    set((state) => {
      const itemIndex = state.currentBill.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return state;

      const item = state.currentBill[itemIndex];
      const newQty = item.quantity + delta;

      if (newQty <= 0) {
        return { currentBill: state.currentBill.filter(i => i.id !== itemId) };
      }

      const mrpNum = parseFloat(item.mrp);
      // We need original tax rates, or we can reverse engineer it
      // Reverse engineer base price from CGST amount if needed, but for now just recalculate proportionally
      const cgstPerUnit = parseFloat(item.cgstAmount) / item.quantity;
      const sgstPerUnit = parseFloat(item.sgstAmount) / item.quantity;

      const updatedBill = [...state.currentBill];
      updatedBill[itemIndex] = {
        ...item,
        quantity: newQty,
        cgstAmount: (cgstPerUnit * newQty).toFixed(2),
        sgstAmount: (sgstPerUnit * newQty).toFixed(2),
        totalPrice: (mrpNum * newQty).toFixed(2)
      };

      return { currentBill: updatedBill };
    });
  },
  
  clearBill: () => set({ currentBill: [] }),
}));
