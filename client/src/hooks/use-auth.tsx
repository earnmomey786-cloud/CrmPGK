import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/user"],
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/user");
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to logout");
      }
      return response.json();
    },
    onSuccess: () => {
      // Clear all cached data immediately
      queryClient.clear();
      // Invalidate user query specifically
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      // Force refresh to login page after clearing cache
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    },
    onError: () => {
      // Even if logout fails on server, clear client state
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // Always redirect to login even if logout fails
      console.error("Logout failed:", error);
      queryClient.clear();
      window.location.href = "/login";
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}