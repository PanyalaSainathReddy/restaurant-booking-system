import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { User, RestaurantOwner } from "../types/auth";
import { useLocation } from "react-router-dom";
import { authStorage } from "../utils/authStorage";

interface AuthContextType {
  user: User | null;
  owner: RestaurantOwner | null;
  isAuthenticated: boolean;
  loading: boolean;
  authChecked: boolean;
  login: (email: string, password: string) => Promise<void>;
  ownerLogin: (email: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  logoutOwner: () => Promise<void>;
  isOwnerRoute: () => boolean;
  isUserRoute: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      return authStorage.getAuth("user");
    } catch {
      return null;
    }
  });

  const [owner, setOwner] = useState<RestaurantOwner | null>(() => {
    try {
      return authStorage.getAuth("owner");
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(!!user || !!owner);

  const isOwnerRoute = () => {
    return location.pathname.startsWith("/owner");
  };

  const isUserRoute = () => {
    return (
      location.pathname.startsWith("/user") ||
      location.pathname.startsWith("/book") ||
      location.pathname.startsWith("/restaurants")
    );
  };

  // Initial auth check on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to get fresh auth data if we have stored data
        if (authStorage.getAuth("user")) {
          const response = await api.get("/auth/user/me");
          setUser(response.data);
          authStorage.setAuth("user", response.data);
        } else if (authStorage.getAuth("owner")) {
          const response = await api.get("/auth/owner/me");
          setOwner(response.data);
          authStorage.setAuth("owner", response.data);
        }
      } catch (error) {
        // Clear invalid auth data
        authStorage.clearAll();
        setUser(null);
        setOwner(null);
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    initAuth();
  }, []);

  // Update isAuthenticated whenever user or owner changes
  useEffect(() => {
    setIsAuthenticated(!!user || !!owner);
  }, [user, owner]);

  const login = async (email: string, password: string) => {
    try {
      // First get tokens
      await api.post("/auth/login/user", { email, password });

      // Then fetch user data
      const userResponse = await api.get("/auth/user/me");
      const userData = userResponse.data;

      // Update state and storage with user data
      setUser(userData);
      authStorage.setAuth("user", userData);
    } catch (error) {
      authStorage.clearAuth("user");
      setUser(null);
      throw error;
    }
  };

  const ownerLogin = async (email: string, password: string) => {
    try {
      // First get tokens
      await api.post("/auth/login/owner", { email, password });

      // Then fetch owner data
      const ownerResponse = await api.get("/auth/owner/me");
      const ownerData = ownerResponse.data;

      // Update state and storage with owner data
      setOwner(ownerData);
      authStorage.setAuth("owner", ownerData);
    } catch (error) {
      authStorage.clearAuth("owner");
      setOwner(null);
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await api.post("/auth/logout/user");
    } finally {
      setUser(null);
      authStorage.clearAuth("user");
    }
  };

  const logoutOwner = async () => {
    try {
      await api.post("/auth/logout/owner");
    } finally {
      setOwner(null);
      authStorage.clearAuth("owner");
    }
  };

  const value = {
    user,
    owner,
    loading,
    authChecked,
    login,
    ownerLogin,
    logoutUser,
    logoutOwner,
    isOwnerRoute,
    isUserRoute,
    isAuthenticated,
  };

  if (!authChecked) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
