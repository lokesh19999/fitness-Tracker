import {
  Activity,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  Map,
  Ruler,
  Settings,
  UtensilsCrossed,
} from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  shortLabel: string
  icon: typeof LayoutDashboard
  primary?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard, primary: true },
  { path: '/daily-log', label: 'Daily Log', shortLabel: 'Daily', icon: CalendarDays, primary: true },
  { path: '/workouts', label: 'Workouts', shortLabel: 'Workout', icon: Dumbbell, primary: true },
  { path: '/nutrition', label: 'Nutrition', shortLabel: 'Nutrition', icon: UtensilsCrossed, primary: true },
  { path: '/more', label: 'More', shortLabel: 'More', icon: Activity, primary: true },
  { path: '/weekly-progress', label: 'Weekly Progress', shortLabel: 'Weekly', icon: ClipboardList },
  { path: '/measurements', label: 'Measurements', shortLabel: 'Measure', icon: Ruler },
  { path: '/roadmap', label: 'Roadmap', shortLabel: 'Roadmap', icon: Map },
  { path: '/data', label: 'Import & Export', shortLabel: 'Data', icon: Activity },
  { path: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
]

export const PRIMARY_ITEMS = NAV_ITEMS.filter((i) => i.primary)
export const MORE_ITEMS = NAV_ITEMS.filter((i) => !i.primary)