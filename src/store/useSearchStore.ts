import { create } from 'zustand';
import { API_BASE_URL } from '@/lib/api';

export interface SearchResult {
  id: number;
  name: string;
  composition: string | null;
  mrp: string;
  totalStock: number;
  cgstRate: string;
  sgstRate: string;
  batches: Array<{
    id: number;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    mrp: string;
  }>;
}

interface SearchState {
  query: string;
  isOpen: boolean;
  results: SearchResult[];
  isLoading: boolean;
  setQuery: (q: string) => void;
  setIsOpen: (isOpen: boolean) => void;
  search: (q: string) => Promise<void>;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  isOpen: false,
  results: [],
  isLoading: false,
  setQuery: (query) => set({ query }),
  setIsOpen: (isOpen) => set({ isOpen }),
  search: async (query) => {
    set({ query, isLoading: true });
    try {
      if (!query) {
        set({ results: [], isLoading: false, isOpen: false });
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const results: SearchResult[] = await response.json();
      set({ results, isLoading: false, isOpen: results.length > 0 });
    } catch (error) {
      console.error('Search failed', error);
      set({ results: [], isLoading: false });
    }
  },
}));
