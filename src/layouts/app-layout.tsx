import { LogOut, Menu, Moon, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Sun, User } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { SyncIndicator } from '@/components/sync-indicator'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/components/theme-provider'
import { useSettings } from '@/features/settings/hooks'
import { NAV_ITEMS, PRIMARY_ITEMS, type NavItem } from '@/layouts/nav'
import { cn } from '@/utils/cn'
import { programmeWeek, toISODate } from '@/utils/dates'

function useCurrentTitle() {
  const { pathname } = useLocation()
  if (pathname === '/more') return 'More'
  return NAV_ITEMS.find((i) => i.path === pathname)?.label ?? 'Dashboard'
}

function NavIcon({ item, showLabel = false }: { item: NavItem; showLabel?: boolean }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-11',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )
      }
      title={item.label}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {showLabel ? <span className="truncate">{item.label}</span> : null}
    </NavLink>
  )
}

export function AppLayout() {
  const { user, signOut } = useAuth()
  const { settings } = useSettings()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const title = useCurrentTitle()
  const [collapsed, setCollapsed] = useState(false)

  const week = programmeWeek(settings.programme_start_date, toISODate(new Date()))
  const weekLabel = week >= 1 && week <= 52 ? `Week ${week}` : week < 1 ? 'Pre-programme' : 'Completed'

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop / tablet sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-card transition-[width] duration-200 md:flex',
          collapsed ? 'md:w-16 lg:w-16' : 'md:w-16 lg:w-64',
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <User className="h-5 w-5" />
          </div>
          <span className={cn('truncate font-semibold', collapsed ? 'hidden' : 'hidden lg:block')}>
            Goddess Physique
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) => (
            <NavIcon key={item.path} item={item} showLabel={!collapsed} />
          ))}
        </nav>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden w-full justify-start lg:flex"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            <span className={collapsed ? 'hidden' : ''}>Collapse</span>
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className={cn('flex min-h-dvh flex-col', collapsed ? 'lg:pl-16' : 'lg:pl-64', 'md:pl-16')}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="truncate text-lg font-semibold">{title}</h1>
            <span className="hidden shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:inline">
              {weekLabel}
            </span>
          </div>
          <SyncIndicator />
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account menu">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="truncate">{user?.email ?? 'Signed in'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Menu className="h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={toggleTheme}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                Toggle theme
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => void signOut()}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-3 pb-24 pt-4 sm:px-5 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {PRIMARY_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              {item.path === '/more' ? <MoreHorizontal className="h-5 w-5" /> : <item.icon className="h-5 w-5" />}
              <span>{item.shortLabel}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}