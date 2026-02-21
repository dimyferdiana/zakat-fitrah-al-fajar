import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Eager load Login page (needed immediately)
import { Login } from '@/pages/Login';

// Eager load auth pages
import { Register } from '@/pages/Register';
import { EmailConfirmation } from '@/pages/EmailConfirmation';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';

// Lazy load all other pages for code splitting
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Muzakki = lazy(() => import('@/pages/Muzakki').then(m => ({ default: m.Muzakki })));
const PemasukanUang = lazy(() => import('@/pages/PemasukanUang').then(m => ({ default: m.PemasukanUang })));
const PemasukanBeras = lazy(() => import('@/pages/PemasukanBeras').then(m => ({ default: m.PemasukanBeras })));
const Mustahik = lazy(() => import('@/pages/Mustahik'));
const Distribusi = lazy(() => import('@/pages/Distribusi'));
const Laporan = lazy(() => import('@/pages/Laporan'));
const Settings = lazy(() => import('@/pages/Settings'));
const SedekahReceipt = lazy(() => import('@/pages/SedekahReceipt'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/email-confirmation" element={<EmailConfirmation />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/muzakki"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <MainLayout>
                      <Muzakki />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pemasukan"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <MainLayout>
                      <PemasukanUang />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pemasukan-beras"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <MainLayout>
                      <PemasukanBeras />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mustahik"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <MainLayout>
                      <Mustahik />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distribusi"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <MainLayout>
                      <Distribusi />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/laporan"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Laporan />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <MainLayout>
                      <Settings />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sedekah-receipt"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <MainLayout>
                      <SedekahReceipt />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
        <Analytics />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
