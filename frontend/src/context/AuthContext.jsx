import React, { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until localStorage is read

  useEffect(() => {
    const stored = localStorage.getItem("access_token");
    if (stored) {
      const payload = decodeJwtPayload(stored);
      if (payload) {
        setToken(stored);
        setUser({ id: parseInt(payload.sub) });
      }
    }
    setLoading(false); // done reading localStorage
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
