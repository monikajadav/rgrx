import { create } from 'zustand';

interface AuthState {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (token: string, username: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  username: null,
  isAuthenticated: false,

  login: (token, username) => {
    localStorage.setItem('rgrx_token', token);
    localStorage.setItem('rgrx_username', username);
    set({ token, username, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('rgrx_token');
    localStorage.removeItem('rgrx_username');
    set({ token: null, username: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('rgrx_token');
    const username = localStorage.getItem('rgrx_username');
    if (token) {
      set({ token, username, isAuthenticated: true });
    }
  },
}));

// Helper to get auth headers for fetch calls
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('rgrx_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}
