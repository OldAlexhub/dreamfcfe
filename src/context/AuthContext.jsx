import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import api, {
  UNAUTHORIZED_EVENT,
  clearStoredToken,
  getErrorMessage,
  getStoredToken,
  setStoredToken
} from "../services/api";

const AuthContext = createContext(null);

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  const username = user.username || "Dream Squad Coach";

  return {
    ...user,
    _id: user._id || user.id || null,
    username,
    teamName: user.teamName || `${username} FC`,
    coins: Number(user.coins || 0),
    packsOpened: Number(user.packsOpened || 0),
    wins: Number(user.wins || 0),
    losses: Number(user.losses || 0)
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  const loadCurrentUser = useCallback(
    async (options = {}) => {
      const { showLoader = true } = options;
      const token = getStoredToken();

      if (!token) {
        setUser(null);
        setLoading(false);
        return null;
      }

      if (showLoader) {
        setLoading(true);
      }

      try {
        const response = await api.get("/auth/me");
        const nextUser = normalizeUser(response.data?.user || response.data?.data?.user);

        setUser(nextUser);
        return nextUser;
      } catch (error) {
        clearSession();
        return null;
      } finally {
        setLoading(false);
      }
    },
    [clearSession]
  );

  const login = useCallback(
    async (credentials) => {
      setLoading(true);

      try {
        const response = await api.post("/auth/login", credentials);
        const token = response.data?.token;
        const nextUser = normalizeUser(response.data?.user || response.data?.data?.user);

        if (!token || !nextUser) {
          throw new Error("The login response did not include a token and user.");
        }

        setStoredToken(token);
        setUser(nextUser);

        return response.data;
      } catch (error) {
        clearSession();
        throw new Error(getErrorMessage(error, "Could not sign in."));
      } finally {
        setLoading(false);
      }
    },
    [clearSession]
  );

  const register = useCallback(
    async (credentials) => {
      setLoading(true);

      try {
        const response = await api.post("/auth/register", credentials);
        const token = response.data?.token;
        const nextUser = normalizeUser(response.data?.user || response.data?.data?.user);

        if (!token || !nextUser) {
          throw new Error("The register response did not include a token and user.");
        }

        setStoredToken(token);
        setUser(nextUser);

        return response.data;
      } catch (error) {
        clearSession();
        throw new Error(getErrorMessage(error, "Could not create your account."));
      } finally {
        setLoading(false);
      }
    },
    [clearSession]
  );

  const logout = useCallback(() => {
    clearSession();
    setLoading(false);
  }, [clearSession]);

  useEffect(() => {
    loadCurrentUser({ showLoader: true });
  }, [loadCurrentUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      setLoading(false);
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user && getStoredToken()),
      login,
      register,
      logout,
      loadCurrentUser
    }),
    [loadCurrentUser, loading, login, logout, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
