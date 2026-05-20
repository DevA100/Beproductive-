import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (token) => {
    localStorage.setItem("token", token);
    getMe().then((res) => setUser(res.data));
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await getMe();
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to refresh user:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);