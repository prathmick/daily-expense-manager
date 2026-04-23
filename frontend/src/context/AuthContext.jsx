import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext(null);

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  // Consider expired if less than 60 seconds remaining
  return payload.exp * 1000 < Date.now() + 60_000;
}

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(null);
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const storedToken   = localStorage.getItem("access_token");
      const refreshToken  = localStorage.getItem("refresh_token");

      if (!storedToken && !refreshToken) {
        setLoading(false);
        return;
      }

      // If access token is still valid, use it directly
      if (storedToken && !isTokenExpired(storedToken)) {
        const payload = decodeJwtPayload(storedToken);
        setToken(storedToken);
        setUser({ id: parseInt(payload.sub) });
        setLoading(false);
        return;
      }

      // Access token expired — try to refresh silently
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefresh } = res.data;
          localStorage.setItem("access_token", access_token);
          if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
          const payload = decodeJwtPayload(access_token);
          setToken(access_token);
          setUser({ id: parseInt(payload.sub) });
        } catch {
          // Refresh token also expired — clear everything, user must log in
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }

      setLoading(false);
    }

    restoreSession();
  }, []);

  function login(tokenResponse) {
    const accessToken = tokenResponse.access_token;
    localStorage.setItem("access_token", accessToken);
    if (tokenResponse.refresh_token) {
      localStorage.setItem("refresh_token", tokenResponse.refresh_token);
    }
    const payload = decodeJwtPayload(accessToken);
    setToken(accessToken);
    setUser(payload ? { id: parseInt(payload.sub) } : null);
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
