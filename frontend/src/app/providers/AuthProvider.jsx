import { createContext, useContext, useState, useEffect, useRef } from 'react';
import socket from '@/socket/socketClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole]             = useState(null);
  const connectCalledRef            = useRef(false);

  useEffect(() => {
    console.log('[AuthProvider] isLoggedIn:', isLoggedIn);
    if (isLoggedIn) {
      if (!connectCalledRef.current) {
        connectCalledRef.current = true;
        socket.connect();
      }
    } else {
      connectCalledRef.current = false;
      socket.disconnect();
    }
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);