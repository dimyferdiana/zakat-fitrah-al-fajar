import type { User } from '@/types/database.types';

// Demo credentials generator - NOT for production use
// These are intentionally simple for demo/testing purposes only
const getDemoPassword = (role: string) => `${role}123`;

// Mock user data for offline development
const MOCK_USERS = [
  {
    id: 'mock-admin-001',
    email: 'admin@masjid.com',
    password: getDemoPassword('admin'),
    nama_lengkap: 'Administrator',
    role: 'admin' as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-bendahara-001',
    email: 'bendahara@masjid.com',
    password: getDemoPassword('bendahara'),
    nama_lengkap: 'Bendahara Masjid',
    role: 'petugas' as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-panitia-001',
    email: 'panitia@masjid.com',
    password: getDemoPassword('panitia'),
    nama_lengkap: 'Panitia Zakat',
    role: 'petugas' as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SESSION_KEY = 'mock_auth_session_v2'; // v2: fixed roles to match DB enum

export interface MockSession {
  user: User;
  token: string;
  expiresAt: number;
}

export const mockAuthService = {
  async signInWithPassword(email: string, password: string): Promise<MockSession> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Email atau password salah');
    }

    if (!user.is_active) {
      throw new Error('Akun Anda tidak aktif. Silakan hubungi administrator.');
    }

    const { password: _, ...userWithoutPassword } = user;
    const session: MockSession = {
      user: userWithoutPassword as User,
      token: `mock-token-${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    };

    // Save to localStorage
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return session;
  },

  async getSession(): Promise<MockSession | null> {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;

    try {
      const session: MockSession = JSON.parse(sessionData);
      
      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  async signOut(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  },

  // Get current user from session
  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user || null;
  },
};

// Export mock user credentials for reference (demo mode only)
export const MOCK_CREDENTIALS = {
  admin: { email: 'admin@masjid.com', password: getDemoPassword('admin') },
  bendahara: { email: 'bendahara@masjid.com', password: getDemoPassword('bendahara') },
  panitia: { email: 'panitia@masjid.com', password: getDemoPassword('panitia') },
};
