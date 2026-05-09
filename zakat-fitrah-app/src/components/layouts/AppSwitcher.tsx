import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronsUpDown, Check, Wheat, Beef, Database } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAppStore } from '@/store/appStore'
import { BRANDING } from '@/lib/branding'

type AppMode = 'zakat' | 'qurban' | 'data-master'

interface AppConfig {
  mode: AppMode
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  defaultPath: string
}

const apps: AppConfig[] = [
  {
    mode: 'zakat',
    name: BRANDING.SIDEBAR_APP_NAME,
    description: 'Manajemen Zakat Fitrah',
    icon: Wheat,
    defaultPath: '/dashboard',
  },
  {
    mode: 'qurban',
    name: 'Qurban',
    description: 'Manajemen Qurban',
    icon: Beef,
    defaultPath: '/qurban',
  },
  {
    mode: 'data-master',
    name: 'Data Master',
    description: 'Manajemen Data Induk',
    icon: Database,
    defaultPath: '/data-master/warga',
  },
]

export function AppSwitcher() {
  const navigate = useNavigate()
  const { activeApp, setActiveApp } = useAppStore()

  const currentApp = apps.find((a) => a.mode === activeApp) ?? apps[0]
  const CurrentIcon = currentApp.icon

  const handleSelect = (app: AppConfig) => {
    setActiveApp(app.mode)
    navigate(app.defaultPath)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <CurrentIcon className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">{currentApp.name}</span>
                <span className="text-xs text-sidebar-foreground/70">{currentApp.description}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Pilih Aplikasi
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {apps.map((app) => {
              const AppIcon = app.icon
              const isActive = activeApp === app.mode
              return (
                <DropdownMenuItem
                  key={app.mode}
                  onClick={() => handleSelect(app)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <AppIcon className="size-3.5 shrink-0" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{app.name}</span>
                    <span className="text-xs text-muted-foreground">{app.description}</span>
                  </div>
                  {isActive && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
