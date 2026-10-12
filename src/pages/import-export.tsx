import { Download, FileJson, FileSpreadsheet, Loader2, Upload, Wand2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { invalidate } from '@/hooks/use-query'
import {
  collectExportPayload,
  FIELD_DEFS,
  runImport,
  restoreBackup,
  type ImportResult,
} from '@/features/data/api'
import {
  exportCsv,
  exportJsonBackup,
  exportWorkbook,
  parseJsonBackup,
  readAllRows,
  readWorkbook,
  type ExportPayload,
  type SheetName,
  type SheetPreview,
} from '@/utils/export-import'

const EXPORT_TABLES: SheetName[] = [
  'daily_logs',
  'meal_entries',
  'body_measurements',
  'weekly_progress',
  'workout_sessions',
  'roadmap_weeks',
]

function autoMap(target: SheetName, headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  for (const def of FIELD_DEFS[target]) {
    const match = headers.find(
      (h) =>
        h.toLowerCase().replace(/[^a-z0-9]/g, '') === def.key.toLowerCase().replace(/[^a-z0-9]/g, '') ||
        h.toLowerCase().includes(def.label.toLowerCase().split(' ')[0]),
    )
    if (match) mapping[def.key] = match
  }
  return mapping
}

export function ImportExportPage() {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Excel import wizard
  const [file, setFile] = useState<File | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [sheets, setSheets] = useState<Record<string, SheetPreview>>({})
  const [target, setTarget] = useState<SheetName>('daily_logs')
  const [sheetName, setSheetName] = useState('')
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [preview, setPreview] = useState<Record<string, unknown>[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<'file' | 'map' | 'preview' | 'done'>('file')

  async function handleExport(kind: 'csv' | 'xlsx' | 'json', table?: SheetName) {
    if (!user) return
    setBusy(true)
    setMessage(null)
    try {
      const payload = await collectExportPayload(user.id)
      if (kind === 'json') exportJsonBackup(payload)
      else if (kind === 'xlsx') exportWorkbook(payload)
      else if (kind === 'csv' && table) exportCsv(payload[table], `${table}.csv`)
      setMessage(kind === 'json' ? 'JSON backup downloaded.' : kind === 'xlsx' ? 'Excel workbook downloaded.' : 'CSV downloaded.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Export failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleFile(f: File | null) {
    setFile(f)
    setImportResult(null)
    setStep('file')
    if (!f) return
    setBusy(true)
    try {
      const { sheetNames: names, sheets: parsed } = await readWorkbook(f)
      setSheetNames(names)
      setSheets(parsed)
      setSheetName(names[0] ?? '')
      if (names[0]) {
        setMapping(autoMap(target, parsed[names[0]]?.headers ?? []))
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not read the workbook.')
    } finally {
      setBusy(false)
    }
  }

  async function loadSheet(name: string) {
    if (!file) return
    setSheetName(name)
    setMapping(autoMap(target, sheets[name]?.headers ?? []))
    const all = await readAllRows(file, name)
    setRows(all)
    setPreview(all.slice(0, 10))
  }

  async function goToPreview() {
    if (!file) return
    const all = await readAllRows(file, sheetName)
    setRows(all)
    setPreview(all.slice(0, 10))
    setStep('preview')
  }

  async function runImportNow() {
    if (!user) return
    setBusy(true)
    try {
      const result = await runImport(user.id, target, rows, mapping)
      setImportResult(result)
      setStep('done')
      ;['daily_logs', 'meals', 'measurements', 'weekly_progress'].forEach((k) => invalidate(k))
      if (user) {
        invalidate(`daily_logs:${user.id}`)
        invalidate(`meals:${user.id}`)
        invalidate(`measurements:${user.id}`)
        invalidate(`weekly_progress:${user.id}`)
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRestore(f: File | null) {
    if (!f || !user) return
    setBusy(true)
    try {
      const text = await f.text()
      const payload: ExportPayload = parseJsonBackup(text)
      const result = await restoreBackup(user.id, payload)
      setImportResult(result)
      setMessage('Backup restored. Reload to see all data.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Restore failed. Check the JSON file.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {message ? <div className="rounded-lg border bg-accent/40 px-4 py-2 text-sm text-accent-foreground">{message}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Export & backup</CardTitle>
          <CardDescription>CSV per data type, a full Excel workbook, or a complete JSON backup.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleExport('xlsx')} disabled={busy}><FileSpreadsheet className="h-4 w-4" /> Excel workbook</Button>
            <Button variant="outline" onClick={() => void handleExport('json')} disabled={busy}><FileJson className="h-4 w-4" /> JSON backup</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXPORT_TABLES.map((t) => (
              <Button key={t} size="sm" variant="ghost" onClick={() => void handleExport('csv', t)} disabled={busy}>
                <Download className="h-3.5 w-3.5" /> {t}.csv
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Import from Excel</CardTitle>
          <CardDescription>Select a worksheet, map columns, preview, then confirm. Duplicates are detected automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Excel file (.xlsx)</Label>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
          </div>

          {file && step !== 'done' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Target data type</Label>
                <Select value={target} onValueChange={(v) => { setTarget(v as SheetName); setMapping(autoMap(v as SheetName, sheets[sheetName]?.headers ?? [])) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_DEFS).map(([k]) => <SelectItem key={k} value={k}>{k.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Worksheet</Label>
                <Select value={sheetName} onValueChange={(v) => void loadSheet(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{sheetNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {file && step === 'map' ? (
            <>
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-medium">Column mapping</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {FIELD_DEFS[target].map((def) => (
                    <div key={def.key} className="flex items-center gap-2 text-sm">
                      <span className="w-40 shrink-0 text-muted-foreground">{def.label}</span>
                      <Select value={mapping[def.key] ?? '__none'} onValueChange={(v) => setMapping({ ...mapping, [def.key]: v === '__none' ? '' : v })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">Not mapped</SelectItem>
                          {(sheets[sheetName]?.headers ?? []).map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => void goToPreview()}>Preview & validate</Button>
            </>
          ) : null}

          {step === 'preview' ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{rows.length} rows found</Badge>
                <span className="text-xs text-muted-foreground">Showing first {preview.length} rows after mapping</span>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {FIELD_DEFS[target].map((d) => <TableHead key={d.key}>{d.label}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((r, i) => (
                      <TableRow key={i}>
                        {FIELD_DEFS[target].map((d) => (
                          <TableCell key={d.key}>{String(r[mapping[d.key]] ?? '')}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => void runImportNow()} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Confirm import
                </Button>
                <Button variant="outline" onClick={() => setStep('map')}>Back to mapping</Button>
              </div>
            </>
          ) : null}

          {step === 'file' && file ? (
            <Button onClick={() => setStep('map')} disabled={!sheetName}>Continue to mapping</Button>
          ) : null}

          {importResult ? (
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">Import summary</p>
              <p className="text-muted-foreground">Inserted: {importResult.inserted} · Updated: {importResult.updated} · Skipped/duplicates: {importResult.skipped}</p>
              {importResult.errors.length > 0 ? (
                <p className="mt-1 text-destructive">{importResult.errors.length} error(s): {importResult.errors.slice(0, 3).join('; ')}</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Restore JSON backup</CardTitle>
          <CardDescription>Validated before writing. Existing rows are updated rather than duplicated.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <input type="file" accept=".json" onChange={(e) => void handleRestore(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
          <p className="flex items-center gap-1 text-xs text-muted-foreground"><Upload className="h-3 w-3" /> Restore is idempotent for weekly progress, roadmap and settings.</p>
        </CardContent>
      </Card>
    </div>
  )
}