import React, { createContext, useState, useEffect } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const loggedInUser = await authService.getUser();
      if (loggedInUser === null && window.location.pathname === "/dashboard") {
        window.location.href = "/";
        return;
      }
      setUser(loggedInUser);
    };

    fetchUser();
  }, []);

  const login = async (userData) => {
    const response = await authService.login(userData);
    const loggedInUser = await authService.getUser();
    setUser(loggedInUser);
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    const registeredUser = await authService.getUser();
    setUser(registeredUser);
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
