import { createContext, useContext, useState, useEffect } from "react";
import { getProfile, saveProfile } from "../db/services";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile().then(p => {
      setProfile(p);
      setLoading(false);
    });
  }, []);

  async function login(profileData) {
    await saveProfile(profileData);
    setProfile(profileData);
  }

  async function logout() {
    await saveProfile(null);
    setProfile(null);
  }

  // Keep token as alias for profile so existing PrivateRoute works
  return (
    <AuthContext.Provider value={{ profile, token: profile, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
