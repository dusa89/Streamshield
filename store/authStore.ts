import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (accessToken: string, refreshToken: string | null) => void;
  clearTokens: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
  clearTokens: () => set({ accessToken: null, refreshToken: null }),
}));

export default useAuthStore;