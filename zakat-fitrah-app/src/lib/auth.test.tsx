import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './auth';

const mocks = vi.hoisted(() => ({
  staff: null as null | Record<string, unknown>,
  customer: null as null | Record<string, unknown>,
  signOut: vi.fn(async () => ({ error: null })),
  signInError: null as Error | null,
  unsubscribe: vi.fn(),
  mode: 'staff' as 'staff' | 'customer',
}));

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: mocks.unsubscribe } } })),
      signInWithPassword: vi.fn(async () => ({ data: { user: mocks.signInError ? null : { id: 'auth-1' } }, error: mocks.signInError })),
      signOut: mocks.signOut,
    },
    rpc: vi.fn(async () => {
      if (mocks.staff?.is_active === false || (!mocks.staff && !mocks.customer?.is_active)) return { data: null, error: new Error('inactive') };
      const mode = mocks.staff ? mocks.mode : 'customer';
      return { data: { mode, staff: mode === 'staff' ? mocks.staff : null, customer: mode === 'customer' ? mocks.customer : null,
        can_staff: !!mocks.staff, can_customer: !!mocks.customer?.is_active }, error: null };
    }),
  },
}));

describe('loan customer authentication', () => {
  let root: Root;
  let container: HTMLDivElement;
  let context: ReturnType<typeof useAuth>;
  function Probe() {
    const value = useAuth();
    useEffect(() => { context = value; }, [value]);
    return null;
  }

  beforeEach(async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    mocks.staff = null;
    mocks.customer = null;
    mocks.signInError = null;
    mocks.mode = 'staff';
    mocks.signOut.mockClear();
    mocks.unsubscribe.mockClear();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
  });

  it('recognizes an active customer without assigning a staff role', async () => {
    mocks.customer = { id: 'customer-1', person_id: 'person-1', is_active: true };
    await act(async () => { expect(await context.login('customer@example.test', 'password')).toBe('customer'); });
    expect(context.customer?.id).toBe('customer-1');
    expect(context.user).toBeNull();
    expect(context.hasRole(['admin', 'petugas'])).toBe(false);
    await act(async () => { await context.logout(); });
    expect(context.customer).toBeNull();
  });

  it('rejects an inactive customer and signs out', async () => {
    mocks.customer = { id: 'customer-1', person_id: 'person-1', is_active: false };
    const expectedError = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => { await expect(context.login('customer@example.test', 'password')).rejects.toThrow('tidak aktif'); });
    expect(mocks.signOut).toHaveBeenCalled();
    expect(context.customer).toBeNull();
    expectedError.mockRestore();
  });

  it('rejects a wrong password without loading a customer profile', async () => {
    mocks.signInError = new Error('Invalid login credentials');
    mocks.customer = { id: 'customer-1', person_id: 'person-1', is_active: true };
    await act(async () => {
      await expect(context.login('customer@example.test', 'wrong-password')).rejects.toThrow('Invalid login credentials');
    });
    expect(context.customer).toBeNull();
    expect(context.user).toBeNull();
  });

  it('retains staff login and rejects inactive staff even if a customer record exists', async () => {
    mocks.staff = { id: 'auth-1', role: 'petugas', is_active: true };
    await act(async () => { expect(await context.login('staff@example.test', 'password')).toBe('staff'); });
    expect(context.hasRole(['petugas'])).toBe(true);
    await act(async () => { await context.logout(); });
    mocks.staff = { id: 'auth-1', role: 'petugas', is_active: false };
    mocks.customer = { id: 'customer-1', person_id: 'person-1', is_active: true };
    await act(async () => { await expect(context.login('staff@example.test', 'password')).rejects.toThrow('tidak aktif'); });
    expect(context.customer).toBeNull();
  });

  it('unsubscribes from auth events on unmount', async () => {
    await act(async () => { root.unmount(); });
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    root = createRoot(container);
  });

  it('uses the server mode for a customer who is also an administrator', async () => {
    mocks.staff = { id: 'auth-1', role: 'admin', is_active: true };
    mocks.customer = { id: 'customer-1', person_id: 'person-1', is_active: true };
    mocks.mode = 'customer';
    await act(async () => { expect(await context.login('dual@example.test', 'password')).toBe('customer'); });
    expect(context.user).toBeNull();
    expect(context.hasRole(['admin'])).toBe(false);
    expect(context.canSwitchStaff).toBe(true);
    expect(context.customer?.id).toBe('customer-1');
  });
});
