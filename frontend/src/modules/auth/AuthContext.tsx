import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../../types';
import { api, getToken, setToken, removeToken } from '../../services/api';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  permissions: string[];
  isLoading: boolean;
  login: (
    username: string,
    password: string,
    remember?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setTokenState] = useState<string | null>(getToken());
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      const currentToken = getToken();
      if (!currentToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get<{
          authenticated: boolean;
          user: AdminUser;
          permissions: string[];
        }>('/api/auth-check');
        if (res.authenticated) {
          setUser(res.user);
          setPermissions(res.permissions || []);
          localStorage.setItem('admin_user', JSON.stringify(res.user));
        } else {
          removeToken();
          setUser(null);
        }
      } catch (err) {
        removeToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    verifyAuth();
  }, []);

  const login = async (identifier: string, password: string, remember = true) => {
    try {
      const res = await api.post<{
        success: boolean;
        token: string;
        admin?: AdminUser;
        user?: AdminUser;
        permissions: string[];
        error?: string;
      }>('/api/login', { username: identifier, email: identifier, password, remember });

      if (res.success && res.token) {
        const adminObj = res.admin || res.user;
        if (adminObj) {
          setUser(adminObj);
          localStorage.setItem('admin_user', JSON.stringify(adminObj));
        }
        setToken(res.token);
        setTokenState(res.token);
        setPermissions(res.permissions || []);
        return { success: true };
      }
      return { success: false, error: res.error || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid email/username or password' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/logout');
    } catch (e) {
      // Ignore
    } finally {
      removeToken();
      setUser(null);
      setTokenState(null);
      setPermissions([]);
    }
  };

  const hasPermission = (perm: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (permissions.includes('*') || permissions.includes(perm)) return true;
    const cat = perm.split(':')[0];
    return permissions.includes(`${cat}:*`) || permissions.includes(`${cat}:write`);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, permissions, isLoading, login, logout, hasPermission }}
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
