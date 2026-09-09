import { createContext, useContext, useEffect, useState } from 'react';
import { getMe } from '../api/employees';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMe()
      .then((res) => setUser(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  const hasRole = (...roles) => roles.some((r) => user?.roles?.includes(r));

  return (
    <AuthContext.Provider value={{ user, loading, error, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
