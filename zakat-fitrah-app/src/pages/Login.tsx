import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, WifiOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { MOCK_CREDENTIALS } from '@/lib/mockAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Handle specific error codes
      let errorMessage = 'Login gagal. Periksa email dan password Anda.';
      
      if (values.email?.includes('Email not confirmed')) {
        errorMessage = 'Silakan konfirmasi email Anda terlebih dahulu. Cek inbox email Anda.';
      } else if (values.email?.includes('Invalid login credentials')) {
        errorMessage = 'Email atau password salah.';
      } else if (values.email?.includes('deactivated')) {
        errorMessage = 'Akun Anda telah dinonaktifkan. Silakan hubungi administrator.';
      }
      
      setError(null);
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Login gagal. Periksa email dan password Anda.';
      
      if (errorMsg?.includes('Email not confirmed')) {
        setError('Silakan konfirmasi email Anda terlebih dahulu. Cek inbox email Anda.');
      } else if (errorMsg?.includes('Invalid login credentials')) {
        setError('Email atau password salah.');
      } else if (errorMsg?.includes('deactivated')) {
        setError('Akun Anda telah dinonaktifkan. Silakan hubungi administrator.');
      } else {
        setError(errorMsg || 'Login gagal. Periksa email dan password Anda.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Aplikasi Zakat Fitrah
          </CardTitle>
          <CardDescription className="text-center">
            Masukkan email dan password Anda untuk login
          </CardDescription>
        </CardHeader>
        <CardContent>
          {OFFLINE_MODE && (
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <WifiOff className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Mode Offline</AlertTitle>
              <AlertDescription className="text-sm text-blue-700">
                Aplikasi berjalan dalam mode offline. Gunakan kredensial berikut:
                <div className="mt-2 space-y-1 font-mono text-xs">
                  <div>Admin: {MOCK_CREDENTIALS.admin.email} / {MOCK_CREDENTIALS.admin.password}</div>
                  <div>Bendahara: {MOCK_CREDENTIALS.bendahara.email} / {MOCK_CREDENTIALS.bendahara.password}</div>
                  <div>Panitia: {MOCK_CREDENTIALS.panitia.email} / {MOCK_CREDENTIALS.panitia.password}</div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="nama@example.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
              <div className="text-center mt-4">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Lupa password?
                </Link>
              </div>
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
