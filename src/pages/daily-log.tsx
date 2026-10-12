import { ArrowDownUp, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { DailyLogForm } from '@/features/daily-log/daily-log-form'
import { deleteDailyLog, type DailyLog } from '@/features/daily-log/api'
import { invalidateDailyLogs, useDailyLogs } from '@/features/daily-log/hooks'
import { average, round } from '@/utils/calculations'
import { formatDate } from '@/utils/dates'

const fmt = (v: number | null | undefined, digits = 1) =>
  v === null || v === undefined ? '—' : v.toFixed(digits)

export function DailyLogPage() {
  const { user } = useAuth()
  const { logs, loading, error, refetch } = useDailyLogs()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date-desc')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<DailyLog | null>(null)
  const [deleting, setDeleting] = useState<DailyLog | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = logs.filter((l) => !q || (l.notes ?? '').toLowerCase().includes(q) || l.log_date.includes(q))
    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case 'date-asc':
          return a.log_date.localeCompare(b.log_date)
        case 'weight-desc':
          return (b.morning_weight_kg ?? -1) - (a.morning_weight_kg ?? -1)
        case 'weight-asc':
          return (a.morning_weight_kg ?? 9999) - (b.morning_weight_kg ?? 9999)
        default:
          return b.log_date.localeCompare(a.log_date)
      }
    })
    return rows
  }, [logs, search, sort])

  const summary = useMemo(
    () => ({
      count: logs.length,
      avgWeight: round(average(logs.map((l) => l.morning_weight_kg)), 2),
      avgCalories: round(average(logs.map((l) => l.calories)), 0),
      avgSteps: round(average(logs.map((l) => l.steps)), 0),
      avgSleep: round(average(logs.map((l) => l.sleep_hours)), 1),
    }),
    [logs],
  )

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(log: DailyLog) {
    setEditing(log)
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!deleting || !user) return
    try {
      await deleteDailyLog(deleting.id)
      invalidateDailyLogs(user.id)
      setMessage('Entry deleted.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Delete failed.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">{summary.count} entries logged</div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> New entry
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border bg-accent/40 px-4 py-2 text-sm text-accent-foreground">{message}</div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg weight</p><p className="text-xl font-semibold">{fmt(summary.avgWeight, 2)} kg</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg calories</p><p className="text-xl font-semibold">{fmt(summary.avgCalories, 0)} kcal</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg steps</p><p className="text-xl font-semibold">{fmt(summary.avgSteps, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg sleep</p><p className="text-xl font-semibold">{fmt(summary.avgSleep)} h</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search notes or date…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="sm:w-48"><ArrowDownUp className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest first</SelectItem>
                <SelectItem value="date-asc">Oldest first</SelectItem>
                <SelectItem value="weight-desc">Weight high → low</SelectItem>
                <SelectItem value="weight-asc">Weight low → high</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? <ErrorState message={error} onRetry={refetch} /> : null}
          {loading ? <LoadingState /> : null}
          {!loading && filtered.length === 0 ? (
            <EmptyState
              title="No daily entries yet"
              description="Log your morning weight, nutrition, steps and sleep to build the dashboard."
              action={<Button onClick={openNew} className="mt-2"><Plus className="h-4 w-4" /> Add your first entry</Button>}
            />
          ) : null}

          {!loading && filtered.length > 0 ? (
            <>
              {/* Mobile cards */}
              <div className="space-y-2 md:hidden">
                {filtered.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="flex items-start justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="font-medium">{formatDate(log.log_date)}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmt(log.morning_weight_kg, 2)} kg · {fmt(log.calories, 0)} kcal · {fmt(log.steps, 0)} steps · {fmt(log.sleep_hours)} h sleep
                        </p>
                        {log.notes ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{log.notes}</p> : null}
                        {log.workout_completed ? <Badge variant="success" className="mt-2">Workout done</Badge> : null}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(log)} aria-label="Edit entry"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(log)} aria-label="Delete entry"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>kcal</TableHead>
                      <TableHead>P / C / F</TableHead>
                      <TableHead>Steps</TableHead>
                      <TableHead>Water</TableHead>
                      <TableHead>Sleep</TableHead>
                      <TableHead>Energy</TableHead>
                      <TableHead>Workout</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{formatDate(log.log_date)}</TableCell>
                        <TableCell>{fmt(log.morning_weight_kg, 2)}</TableCell>
                        <TableCell>{fmt(log.calories, 0)}</TableCell>
                        <TableCell>{fmt(log.protein_g, 0)}/{fmt(log.carbs_g, 0)}/{fmt(log.fat_g, 0)}</TableCell>
                        <TableCell>{fmt(log.steps, 0)}</TableCell>
                        <TableCell>{fmt(log.water_l, 1)}</TableCell>
                        <TableCell>{fmt(log.sleep_hours, 1)}</TableCell>
                        <TableCell>{log.energy_rating ?? '—'}</TableCell>
                        <TableCell>{log.workout_completed ? <Badge variant="success">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(log)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleting(log)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit daily entry' : 'New daily entry'}</DialogTitle>
          </DialogHeader>
          <DailyLogForm
            editing={editing}
            onSaved={(msg) => {
              setMessage(msg)
              setFormOpen(false)
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title="Delete this entry?"
        description="This removes the daily log from the cloud on all your devices."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}