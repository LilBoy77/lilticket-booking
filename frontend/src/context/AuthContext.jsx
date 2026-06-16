import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authService } from "../services/authService.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authRequestIdRef = useRef(0);

  const checkAuth = useCallback(async () => {
    const requestId = authRequestIdRef.current + 1;
    authRequestIdRef.current = requestId;

    try {
      const response = await authService.getMe();
      if (authRequestIdRef.current === requestId) {
        setUser(response.data.user);
      }
      return response.data.user;
    } catch (_error) {
      if (authRequestIdRef.current === requestId) {
        setUser(null);
      }
      return null;
    } finally {
      if (authRequestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  const login = useCallback(async (payload) => {
    const response = await authService.login(payload);
    authRequestIdRef.current += 1;
    setUser(response.data.user);
    setLoading(false);
    return response.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await authService.register(payload);
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (_error) {
    } finally {
      authRequestIdRef.current += 1;
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = useMemo(
    () => ({
      checkAuth,
      isAuthenticated: Boolean(user),
      loading,
      login,
      logout,
      register,
      user,
    }),
    [checkAuth, loading, login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
