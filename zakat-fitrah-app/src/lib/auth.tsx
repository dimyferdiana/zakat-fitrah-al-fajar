import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { mockAuthService } from './mockAuth';
import type { User, UserRole } from '@/types/database.types';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimer, setSessionTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      if (OFFLINE_MODE) {
        // Offline mode: check mock session
        const mockSession = await mockAuthService.getSession();
        if (mockSession) {
          setUser(mockSession.user);
          setSession({ user: { id: mockSession.user.id } } as Session);
          startSessionTimer();
        }
        setLoading(false);
      } else {
        // Online mode: use Supabase
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          if (session) {
            fetchUserData(session.user.id);
            startSessionTimer();
          } else {
            setLoading(false);
          }
        });

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          if (session) {
            fetchUserData(session.user.id);
            startSessionTimer();
          } else {
            setUser(null);
            clearSessionTimer();
            setLoading(false);
          }
        });

        return () => {
          subscription.unsubscribe();
          clearSessionTimer();
        };
      }
    };

    initAuth();

    // Cleanup for offline mode
    return () => {
      clearSessionTimer();
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If user not found in users table, show helpful error
        if (error.code === 'PGRST116') {
          console.error('User not found in users table. Auth user exists but database record missing.');
          await logout();
          throw new Error(
            'Akun Anda belum terdaftar di sistem. ' +
            'Silakan hubungi administrator untuk mengaktifkan akun Anda.'
          );
        }
        throw error;
      }

      if (data && !(data as User).is_active) {
        await logout();
        throw new Error('Akun Anda tidak aktif. Silakan hubungi administrator.');
      }

      setUser(data as User);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
      // Re-throw to show error to user
      if (error instanceof Error) {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const startSessionTimer = () => {
    clearSessionTimer();
    const timer = setTimeout(() => {
      logout();
    }, SESSION_TIMEOUT);
    setSessionTimer(timer);
  };

  const clearSessionTimer = () => {
    if (sessionTimer) {
      clearTimeout(sessionTimer);
      setSessionTimer(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      if (OFFLINE_MODE) {
        // Offline mode: use mock auth
        const mockSession = await mockAuthService.signInWithPassword(email, password);
        setUser(mockSession.user);
        setSession({ user: { id: mockSession.user.id } } as Session);
        startSessionTimer();
      } else {
        // Online mode: use Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          try {
            await fetchUserData(data.user.id);
          } catch (fetchError) {
            // If fetchUserData fails, sign out and show error
            await supabase.auth.signOut();
            throw fetchError;
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      clearSessionTimer();
      if (OFFLINE_MODE) {
        // Offline mode: clear mock session
        await mockAuthService.signOut();
      } else {
        // Online mode: sign out from Supabase
        await supabase.auth.signOut();
      }
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value = {
    user,
    session,
    loading,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
