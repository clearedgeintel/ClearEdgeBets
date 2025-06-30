import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  subscriptionTier: "free" | "pro" | "elite";
  subscriptionStatus: string | null;
  createdAt?: Date | string;
  subscriptionEndDate?: Date | string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  hasAccess: (tier: "free" | "pro" | "elite") => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiRequest("GET", "/api/auth/me");
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await response.json();
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/register", { username, email, password });
    const data = await response.json();
    setUser(data.user);
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    setUser(null);
  };

  const hasAccess = (requiredTier: "free" | "pro" | "elite"): boolean => {
    if (!user) return requiredTier === "free";
    
    const tierLevels = { free: 0, pro: 1, elite: 2 };
    const userLevel = tierLevels[user.subscriptionTier];
    const requiredLevel = tierLevels[requiredTier];
    
    return userLevel >= requiredLevel;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}