import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { mockAuthService } from './mockAuth';
import { queryClient } from './queryClient';
import type { User, UserRole } from '@/types/database.types';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';
const client = supabase as unknown as SupabaseClient;
type Mode = 'staff' | 'customer';
interface CustomerSession { id: string; person_id: string; is_active: boolean }
interface AuthSnapshot { mode: Mode; staff: User | null; customer: CustomerSession | null; can_staff: boolean; can_customer: boolean }
interface AuthContextType {
  user: User | null; customer: CustomerSession | null; session: Session | null; loading: boolean;
  canSwitchStaff: boolean; canSwitchCustomer: boolean;
  login: (email: string, password: string) => Promise<Mode>;
  logout: () => Promise<void>; switchMode: (mode: Mode) => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [capabilities, setCapabilities] = useState({ staff: false, customer: false });
  const sessionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const epoch = useRef(0);
  const invalidateRequests = useCallback(() => { epoch.current++; }, []);
  const clearTimer = useCallback(() => { if (sessionTimer.current) clearTimeout(sessionTimer.current); sessionTimer.current = null; }, []);
  const clearProfile = useCallback(() => {
    epoch.current++; clearTimer(); queryClient.clear(); setUser(null); setCustomer(null);
    setCapabilities({ staff: false, customer: false }); setSession(null); setLoading(false);
  }, [clearTimer]);
  const logout = useCallback(async () => {
    try { if (OFFLINE_MODE) await mockAuthService.signOut(); else await supabase.auth.signOut(); }
    finally { clearProfile(); }
  }, [clearProfile]);
  const startTimer = useCallback(() => {
    clearTimer(); sessionTimer.current = setTimeout(() => { void logout(); }, 8 * 60 * 60 * 1000);
  }, [clearTimer, logout]);
  const fetchProfile = useCallback(async () => {
    const request = ++epoch.current;
    const { data, error } = await client.rpc('loan_auth_context');
    if (error || !data || !['staff', 'customer'].includes(data.mode)) throw new Error('Akun tidak aktif atau sesi berakhir. Silakan masuk kembali.');
    const profile = data as AuthSnapshot;
    if (request === epoch.current) {
      queryClient.clear(); setUser(profile.staff); setCustomer(profile.customer);
      setCapabilities({ staff: profile.can_staff, customer: profile.can_customer }); setLoading(false);
    }
    return profile.mode;
  }, []);

  useEffect(() => {
    let disposed = false;
    if (OFFLINE_MODE) {
      void mockAuthService.getSession().then(value => {
        if (disposed) return;
        if (value) { setUser(value.user); setSession({ user: { id: value.user.id } } as Session); setCapabilities({ staff: true, customer: false }); startTimer(); }
        setLoading(false);
      });
      return () => { disposed = true; invalidateRequests(); clearTimer(); };
    }
    const load = async (nextSession: Session | null) => {
      if (disposed) return;
      if (!nextSession) { clearProfile(); return; }
      setSession(nextSession); setLoading(true);
      try { await fetchProfile(); if (!disposed) startTimer(); }
      catch { if (!disposed) { await supabase.auth.signOut(); clearProfile(); } }
    };
    void supabase.auth.getSession().then(({ data, error }) => { if (error) clearProfile(); else void load(data.session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Supabase calls must run after the auth callback releases its lock.
      setTimeout(() => { if (!disposed) void load(nextSession); }, 0);
    });
    const onModeChange = (event: StorageEvent) => { if (event.key === 'loan-session-mode-changed') window.location.reload(); };
    window.addEventListener('storage', onModeChange);
    return () => { disposed = true; invalidateRequests(); subscription.unsubscribe(); clearTimer(); window.removeEventListener('storage', onModeChange); };
  }, [clearProfile, clearTimer, fetchProfile, startTimer, invalidateRequests]);

  const login = async (email: string, password: string): Promise<Mode> => {
    if (OFFLINE_MODE) {
      const value = await mockAuthService.signInWithPassword(email, password);
      setUser(value.user); setCustomer(null); setCapabilities({ staff: true, customer: false });
      setSession({ user: { id: value.user.id } } as Session); startTimer(); return 'staff';
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    if (!data.user) throw new Error('Login gagal.');
    try { const mode = await fetchProfile(); setSession(data.session); startTimer(); return mode; }
    catch (error) { await logout(); throw error; }
  };
  const switchMode = async (mode: Mode) => {
    const { error } = await client.rpc('loan_set_session_mode', { p_mode: mode });
    if (error) throw new Error('Mode tidak dapat diganti. Silakan masuk kembali.');
    queryClient.clear(); localStorage.setItem('loan-session-mode-changed', crypto.randomUUID());
    window.location.assign(mode === 'customer' ? '/portal-pinjaman' : '/dashboard');
  };
  return <AuthContext.Provider value={{ user, customer, session, loading, canSwitchStaff: capabilities.staff,
    canSwitchCustomer: capabilities.customer, login, logout, switchMode, hasRole: roles => !!user && roles.includes(user.role) }}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
