import { create } from "zustand";

export interface Coordinator {
  id: string;
  email: string;
  name: string;
  role: "admin" | "coordinator" | "viewer";
  institution: string;
}

interface AuthState {
  coordinator: Coordinator | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const storedToken = localStorage.getItem("beacon_token");
const storedCoordinator = localStorage.getItem("beacon_coordinator");

export const useAuthStore = create<AuthState>((set, _get) => ({
  coordinator: storedCoordinator ? JSON.parse(storedCoordinator) : null,
  token: storedToken,
  isAuthenticated: !!storedToken,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const res = await fetch("/api/v1/coordinators/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || "Invalid credentials");
      }

      const json = await res.json();
      const { token, coordinator } = json.data;

      localStorage.setItem("beacon_token", token);
      localStorage.setItem("beacon_coordinator", JSON.stringify(coordinator));

      set({
        coordinator,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Login failed",
      });
    }
  },

  logout: () => {
    localStorage.removeItem("beacon_token");
    localStorage.removeItem("beacon_coordinator");
    set({
      coordinator: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
