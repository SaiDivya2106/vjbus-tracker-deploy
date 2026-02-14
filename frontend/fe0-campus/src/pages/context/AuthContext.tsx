import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  login: () => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  setLoginModalOpen: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  // ✅ Trigger modal instead of redirect
  const login = () => {
    setLoginModalOpen(true);
  };

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_AUTH_URL}/logout`, {
        method: 'POST',
        credentials: 'include',

      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setIsAuthenticated(false);
  };

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const response = await fetch(`${import.meta.env.VITE_AUTH_URL}/check-auth`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        setIsAuthenticated(data.logged_in || false);
      } catch (err) {
        console.error('Auth check failed', err);
        setIsAuthenticated(false);
      }
    }

    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
        isLoginModalOpen,
        setLoginModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
