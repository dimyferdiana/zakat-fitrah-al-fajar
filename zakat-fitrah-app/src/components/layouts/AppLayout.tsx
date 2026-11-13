import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Send,
  FileText,
  Settings,
  LogOut,
  Wallet,
  Receipt,
  Wheat,
  ScrollText,
  Landmark,
  Beef,
  ChevronsUpDown,
  Heart,
  UserCog,
  Settings2,
  BarChart3,
  CalendarDays,
  List,
  Truck,
  HandCoins,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import type { UserRole } from '@/types/database.types'
import { useAppStore } from '@/store/appStore'
import { AppSwitcher } from '@/components/layouts/AppSwitcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarCloseOnSelect,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface AppLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
  hidden?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const zakatNavSections: NavSection[] = [
  {
    title: 'Ringkasan',
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Data Master',
    items: [
      {
        label: 'Data Muzakki',
        path: '/muzakki',
        icon: Users,
        roles: ['admin', 'petugas'],
      },
      {
        label: 'Data Mustahik',
        path: '/mustahik',
        icon: UserCheck,
        roles: ['admin', 'petugas'],
      },
    ],
  },
  {
    title: 'Transaksi',
    items: [
      {
        label: 'Penerimaan Uang',
        path: '/penerimaan-uang',
        icon: Wallet,
        roles: ['admin', 'petugas'],
      },
      {
        label: 'Penerimaan Beras',
        path: '/penerimaan-beras',
        icon: Wheat,
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
    ],
  },
  {
    title: 'Laporan',
    items: [
      {
        label: 'Laporan',
        path: '/laporan',
        icon: FileText,
      },
      {
        label: 'Surat Pengantar',
        path: '/surat-pengantar',
        icon: ScrollText,
        roles: ['admin'],
        hidden: true,
      },
    ],
  },
  {
    title: 'Sistem',
    items: [
      {
        label: 'Manajemen Rekening',
        path: '/accounts',
        icon: Landmark,
        roles: ['admin', 'petugas'],
      },
      {
        label: 'Konfigurasi Dashboard',
        path: '/dashboard-settings',
        icon: LayoutDashboard,
        roles: ['admin'],
      },
      {
        label: 'Pengaturan',
        path: '/settings',
        icon: Settings,
        roles: ['admin'],
      },
    ],
  },
]

const qurbanNavSections: NavSection[] = [
  {
    title: 'Qurban',
    items: [
      {
        label: 'Dashboard Qurban',
        path: '/qurban/dashboard',
        icon: BarChart3,
        roles: ['admin', 'petugas'],
      },
      {
        label: 'Manajemen Event',
        path: '/qurban/events',
        icon: CalendarDays,
        roles: ['admin', 'petugas'],
      },
      {
        label: 'Data Hewan',
        path: '/qurban',
        icon: Beef,
        roles: ['admin', 'petugas'],
      },
      {
        label: 'Daftar Peserta',
        path: '/qurban/peserta',
        icon: List,
        roles: ['admin', 'petugas'],
      },
      {
        label: 'Distribusi Qurban',
        path: '/qurban/distribusi',
        icon: Truck,
        roles: ['admin', 'petugas'],
      },
    ],
  },
]

const loanNavSections: NavSection[] = [{
  title: 'Pinjaman Jamaah',
  items: [
    { label: 'Ringkasan Pinjaman', path: '/pinjaman/dashboard', icon: LayoutDashboard, roles: ['admin', 'petugas'] },
    { label: 'Ringkasan & izin pinjaman', path: '/pinjaman/ringkasan', icon: UserCheck, roles: ['admin', 'petugas'] },
    { label: 'Nasabah', path: '/pinjaman/nasabah', icon: Users, roles: ['admin', 'petugas'] },
    { label: 'Pinjaman', path: '/pinjaman/daftar', icon: HandCoins, roles: ['admin', 'petugas'] },
    { label: 'Pembayaran', path: '/pinjaman/pembayaran', icon: Wallet, roles: ['admin', 'petugas'] },
    { label: 'Laporan Pinjaman', path: '/pinjaman/laporan', icon: BarChart3, roles: ['admin', 'petugas'] },
    { label: 'Pengaturan Pinjaman', path: '/pinjaman/pengaturan', icon: Settings, roles: ['admin', 'petugas'] },
  ],
}]

function NavigationLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon
  return <SidebarMenuItem><SidebarCloseOnSelect><SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
    <Link to={item.path} aria-current={isActive ? 'page' : undefined}><Icon /><span>{item.label}</span></Link>
  </SidebarMenuButton></SidebarCloseOnSelect></SidebarMenuItem>
}

const dataMasterNavSections: NavSection[] = [
  {
    title: 'Data Master',
    items: [
      {
        label: 'Warga',
        path: '/data-master/warga',
        icon: Users,
      },
      {
        label: 'Mustahik',
        path: '/data-master/mustahik',
        icon: Heart,
      },
      {
        label: 'Pengguna',
        path: '/data-master/pengguna',
        icon: UserCog,
        roles: ['admin'],
      },
      {
        label: 'Pengaturan UPZ',
        path: '/data-master/upz-settings',
        icon: Settings2,
        roles: ['admin'],
      },
    ],
  },
]

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, hasRole, canSwitchCustomer, switchMode } = useAuth()
  const { activeApp, setActiveApp } = useAppStore()
  const loanPath = location.pathname === '/pinjaman' || location.pathname.startsWith('/pinjaman/')
  const currentApp = loanPath ? 'pinjaman' : location.pathname.startsWith('/qurban') ? 'qurban' : location.pathname.startsWith('/data-master') ? 'data-master' : 'zakat'

  useEffect(() => {
    if (activeApp !== currentApp) setActiveApp(currentApp)
  }, [currentApp, activeApp, setActiveApp])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const allNavSections =
    currentApp === 'zakat' ? zakatNavSections :
    currentApp === 'qurban' ? qurbanNavSections :
    currentApp === 'pinjaman' ? loanNavSections :
    dataMasterNavSections

  const filteredNavSections = allNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.hidden && (!item.roles || hasRole(item.roles))
      ),
    }))
    .filter((section) => section.items.length > 0)

  // Find current page title from all items in all sections (including hidden)
  const allNavItems = allNavSections.flatMap((s) => s.items)
  const currentPageTitle =
    allNavItems.find((item) => item.path === location.pathname || (item.path === '/pinjaman/daftar' && (location.pathname.startsWith('/pinjaman/daftar/') || location.pathname === '/pinjaman/baru')) || (item.path === '/pinjaman/nasabah' && location.pathname.startsWith('/pinjaman/nasabah/')))?.label ?? (loanPath ? 'Ringkasan Pinjaman' : 'Dashboard')

  const userInitials = user?.nama_lengkap
    ? user.nama_lengkap
        .split(' ')
        .slice(0, 2)
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <AppSwitcher />
        </SidebarHeader>

        <SidebarContent>
          {filteredNavSections.map((section) => (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => <NavigationLink key={item.path} item={item} isActive={location.pathname === item.path || (item.path === '/pinjaman/daftar' && (location.pathname.startsWith('/pinjaman/daftar/') || location.pathname === '/pinjaman/baru')) || (item.path === '/pinjaman/nasabah' && location.pathname.startsWith('/pinjaman/nasabah/'))} />)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    aria-label={`Menu akun ${user?.nama_lengkap ?? 'pengguna'}`}
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-semibold">{user?.nama_lengkap}</span>
                      <span className="truncate text-xs capitalize text-sidebar-foreground/70">
                        {user?.role}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.nama_lengkap}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user?.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        {/* Page Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className={loanPath ? '-ml-1 h-11 w-11' : '-ml-1'} />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center gap-2">
            {loanPath ? <span className="text-lg font-semibold">{currentPageTitle}</span> : <h1 className="text-lg font-semibold">{currentPageTitle}</h1>}
          </div>
          {canSwitchCustomer && <Button variant="outline" className="min-h-11" onClick={() => void switchMode('customer').catch(() => window.location.assign('/login'))}>Mode nasabah</Button>}
          {/* Mobile user menu */}
          <div className="flex items-center gap-2 md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full" aria-label={`Menu akun ${user?.nama_lengkap ?? 'pengguna'}`}>
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.nama_lengkap}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10 p-4 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
