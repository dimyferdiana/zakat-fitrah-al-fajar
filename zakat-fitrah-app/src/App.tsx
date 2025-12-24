import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Muzakki } from '@/pages/Muzakki';
import Settings from '@/pages/Settings';
import Mustahik from '@/pages/Mustahik';
import Distribusi from '@/pages/Distribusi';
import Laporan from '@/pages/Laporan';

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
          <Routes>
            <Route path="/login" element={<Login />} />
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
