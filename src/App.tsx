import { Loader2 } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { TooltipProvider } from '@/components/ui/tooltip'
import { ErrorBoundary } from '@/components/error-boundary'
import { GlobalSync } from '@/components/global-sync'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { AppLayout } from '@/layouts/app-layout'
import { LoginPage } from '@/pages/login'
import { SetupRequiredPage } from '@/pages/setup'

const DashboardPage = lazy(() => import('@/pages/dashboard').then((m) => ({ default: m.DashboardPage })))
const DailyLogPage = lazy(() => import('@/pages/daily-log').then((m) => ({ default: m.DailyLogPage })))
const WorkoutsPage = lazy(() => import('@/pages/workouts').then((m) => ({ default: m.WorkoutsPage })))
const NutritionPage = lazy(() => import('@/pages/nutrition').then((m) => ({ default: m.NutritionPage })))
const WeeklyProgressPage = lazy(() =>
  import('@/pages/weekly-progress').then((m) => ({ default: m.WeeklyProgressPage })),
)
const MeasurementsPage = lazy(() => import('@/pages/measurements').then((m) => ({ default: m.MeasurementsPage })))
const RoadmapPage = lazy(() => import('@/pages/roadmap').then((m) => ({ default: m.RoadmapPage })))
const ImportExportPage = lazy(() => import('@/pages/import-export').then((m) => ({ default: m.ImportExportPage })))
const SettingsPage = lazy(() => import('@/pages/settings').then((m) => ({ default: m.SettingsPage })))
const MorePage = lazy(() => import('@/pages/more').then((m) => ({ default: m.MorePage })))

function PageLoader() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function ProtectedRoutes() {
  const { user, loading, configured } = useAuth()

  if (!configured) return <SetupRequiredPage />
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="daily-log" element={<DailyLogPage />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="nutrition" element={<NutritionPage />} />
          <Route path="weekly-progress" element={<WeeklyProgressPage />} />
          <Route path="measurements" element={<MeasurementsPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="data" element={<ImportExportPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            <GlobalSync />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}