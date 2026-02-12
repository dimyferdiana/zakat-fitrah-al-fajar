import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Users,
  Heart,
  Send,
  FileText,
  Settings,
  Menu,
  LogOut,
  User,
  Wallet,
  Receipt,
  Wheat,
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Data Muzakki',
    path: '/muzakki',
    icon: Users,
    roles: ['admin', 'petugas'],
  },
  {
    label: 'Pemasukan Uang',
    path: '/pemasukan',
    icon: Wallet,
    roles: ['admin', 'petugas'],
  },
  {
    label: 'Pemasukan Beras',
    path: '/pemasukan-beras',
    icon: Wheat,
    roles: ['admin', 'petugas'],
  },
  {
    label: 'Data Mustahik',
    path: '/mustahik',
    icon: Heart,
    roles: ['admin', 'petugas'],
  },
  {
    label: 'Distribusi Zakat',
    path: '/distribusi',
    icon: Send,
    roles: ['admin', 'petugas'],
  },
  {
    label: 'Bukti Sedekah',
    path: '/sedekah-receipt',
    icon: Receipt,
    roles: ['admin', 'petugas'],
  },
  {
    label: 'Laporan',
    path: '/laporan',
    icon: FileText,
  },
  {
    label: 'Pengaturan',
    path: '/settings',
    icon: Settings,
    roles: ['admin'],
  },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || hasRole(item.roles)
  );

  const isActive = (path: string) => location.pathname === path;

  const NavContent = () => (
    <nav className="space-y-2">
      {filteredNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <Link key={item.path} to={item.path}>
            <Button
              variant={active ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-muted/40 lg:block">
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center border-b px-6">
            <h2 className="text-lg font-semibold">Zakat Fitrah</h2>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <NavContent />
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">{user?.nama_lengkap}</p>
              <p className="text-xs capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
              <SheetDescription className="sr-only">
                Menu navigasi aplikasi Zakat Fitrah
              </SheetDescription>
              <div className="flex h-full flex-col">
                {/* Mobile Logo */}
                <div className="flex h-16 items-center border-b px-6">
                  <h2 className="text-lg font-semibold">Zakat Fitrah</h2>
                </div>

                {/* Mobile Navigation */}
                <div className="flex-1 overflow-y-auto p-4">
                  <NavContent />
                </div>

                {/* Mobile Footer */}
                <div className="border-t p-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">{user?.nama_lengkap}</p>
                    <p className="text-xs capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Page Title (could be passed as prop) */}
          <div className="flex-1 lg:ml-0">
            <h1 className="text-lg font-semibold lg:text-xl">
              {navItems.find((item) => item.path === location.pathname)?.label ||
                'Dashboard'}
            </h1>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.nama_lengkap}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {user?.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
