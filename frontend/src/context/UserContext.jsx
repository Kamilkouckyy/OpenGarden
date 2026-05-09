import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authClient } from '../services/authClient';

export const UserContext = createContext({
  user: null,
  loading: true,
  refreshUser: () => {},
  logout: () => {},
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const session = await authClient.getSession();
      const sessionUser = session?.data?.user ?? session?.user ?? null;
      setUser(
        sessionUser
          ? {
              id: sessionUser.id,
              name: sessionUser.name || sessionUser.email,
              email: sessionUser.email,
              role: sessionUser.role || 'member',
            }
          : null,
      );
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await authClient.signOut();
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
