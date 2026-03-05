import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthState } from '@/types';
import { 
  getCurrentUser, 
  setCurrentUser, 
  findUserByUsername,
  initializeDefaultData,
  isUserExpired
} from '@/services/storage';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicializar datos por defecto
    initializeDefaultData();
    
    // Verificar si hay sesión activa
    const currentUser = getCurrentUser();
    if (currentUser) {
      setAuthState({
        user: currentUser,
        isAuthenticated: true,
        isAdmin: currentUser.role === 'admin',
      });
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);

    try {
      const user = findUserByUsername(username);
      
      if (!user) {
        setError('Usuario no encontrado');
        return false;
      }

      if (user.password !== password) {
        setError('Contraseña incorrecta');
        return false;
      }

      // Verificar si el usuario ha expirado
      if (isUserExpired(user)) {
        setError('Usuario caducado, contacte con la autoescuela y renueve comprando de nuevo la licencia');
        return false;
      }

      setCurrentUser(user);
      setAuthState({
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
      });
      
      return true;
    } catch (err) {
      setError('Error al iniciar sesión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setAuthState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
    });
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        error,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
