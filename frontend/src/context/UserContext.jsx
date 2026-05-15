import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authClient } from '../services/authClient';
import { usersApi } from '../services/api';
import { clearAccessToken, getAccessToken } from '../services/authStorage';

export const UserContext = createContext({
  user: null,
  loading: true,
  refreshUser: () => {},
  logout: () => {},
});

function mapAppUser(appUser) {
  return {
    id: appUser.id,
    name: appUser.name || appUser.email,
    email: appUser.email,
    role: appUser.role || 'member',
  };
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const session = await authClient.getSession();
      const sessionUser = session?.data?.user ?? session?.user ?? null;

      if (sessionUser?.email) {
        try {
          const appUser = await usersApi.me();
          setUser(mapAppUser(appUser));
          return;
        } catch {
          try {
            await authClient.signOut();
          } catch {
            // ignore stale session cleanup errors
          }
        }
      }

      if (getAccessToken()) {
        const appUser = await usersApi.me();
        setUser(mapAppUser(appUser));
        return;
      }

      setUser(null);
    } catch (error) {
      if (error?.status === 401) {
        clearAccessToken();
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    clearAccessToken();
    try {
      await authClient.signOut();
    } catch {
      // ignore when session was created via email/password JWT only
    }
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
