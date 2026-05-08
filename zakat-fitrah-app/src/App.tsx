import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layouts/AppLayout';
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
const DashboardSettings = lazy(() => import('@/pages/DashboardSettings').then(m => ({ default: m.DashboardSettings })));
const SedekahReceipt = lazy(() => import('@/pages/SedekahReceipt'));
const SuratPengantar = lazy(() => import('@/pages/SuratPengantar'));
const AccountsManagement = lazy(() => import('@/pages/AccountsManagement'));
const Qurban = lazy(() => import('@/pages/Qurban'));
const QurbanDashboard = lazy(() => import('@/pages/QurbanDashboard').then(m => ({ default: m.QurbanDashboard })))
const QurbanEvents = lazy(() => import('@/pages/QurbanEvents').then(m => ({ default: m.QurbanEvents })))
const QurbanPeserta = lazy(() => import('@/pages/QurbanPeserta').then(m => ({ default: m.QurbanPeserta })))
const QurbanDistribusi = lazy(() => import('@/pages/QurbanDistribusi').then(m => ({ default: m.QurbanDistribusi })))
const QurbanScan = lazy(() => import('@/pages/QurbanScan').then(m => ({ default: m.QurbanScan })))

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
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/muzakki"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <AppLayout>
                      <Muzakki />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/penerimaan-uang"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <AppLayout>
                      <PemasukanUang />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/penerimaan-beras"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <AppLayout>
                      <PemasukanBeras />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pemasukan"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <Navigate to="/penerimaan-uang" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pemasukan-beras"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <Navigate to="/penerimaan-beras" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mustahik"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <AppLayout>
                      <Mustahik />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distribusi"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <AppLayout>
                      <Distribusi />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/laporan"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Laporan />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <Settings />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard-settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <DashboardSettings />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sedekah-receipt"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <AppLayout>
                      <SedekahReceipt />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/surat-pengantar"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <SuratPengantar />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounts"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <AppLayout>
                      <AccountsManagement />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qurban"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <AppLayout>
                      <Qurban />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qurban/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <AppLayout>
                      <QurbanDashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qurban/events"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <AppLayout>
                      <QurbanEvents />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qurban/peserta"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <AppLayout>
                      <QurbanPeserta />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qurban/distribusi"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <AppLayout>
                      <QurbanDistribusi />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qurban/scan"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'petugas']}>
                    <AppLayout>
                      <QurbanScan />
                    </AppLayout>
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
