import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/states'
import { formatDate } from '@/utils/dates'

function ChartShell({
  title,
  children,
  empty,
  isEmpty,
}: {
  title: string
  children: React.ReactNode
  empty?: string
  isEmpty?: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64 w-full pl-0">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState title="No data yet" description={empty} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

const axisProps = { tick: { fontSize: 11 }, stroke: 'currentColor', opacity: 0.5 }
const tooltipStyle = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--popover-foreground)',
}

const shortDate = (value: string) =>
  formatDate(value, { month: 'short', day: 'numeric' })

export function WeightTrendChart({ data }: { data: { date: string; weight: number | null }[] }) {
  return (
    <ChartShell title="Body-weight trend (kg)" isEmpty={data.length === 0} empty="Log your morning weight in the Daily Log.">
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="date" tickFormatter={shortDate} {...axisProps} />
        <YAxis domain={['auto', 'auto']} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => shortDate(String(label))} />
        <Area type="monotone" dataKey="weight" stroke="var(--chart-1)" fill="url(#weightFill)" strokeWidth={2} connectNulls />
      </AreaChart>
    </ChartShell>
  )
}

export function MeasurementsChart({
  data,
}: {
  data: { date: string; waist: number | null; hip: number | null }[]
}) {
  return (
    <ChartShell
      title="Waist & hip measurements (cm)"
      isEmpty={data.length === 0}
      empty="Add body measurements to see trends."
    >
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="date" tickFormatter={shortDate} {...axisProps} />
        <YAxis domain={['auto', 'auto']} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => shortDate(String(label))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="waist" name="Waist" stroke="var(--chart-1)" strokeWidth={2} connectNulls />
        <Line type="monotone" dataKey="hip" name="Hip" stroke="var(--chart-3)" strokeWidth={2} connectNulls />
      </LineChart>
    </ChartShell>
  )
}

export function TargetLineChart({
  title,
  data,
  dataKey,
  target,
  color,
  unit,
}: {
  title: string
  data: { date: string; [k: string]: number | string | null }[]
  dataKey: string
  target: number
  color: string
  unit: string
}) {
  return (
    <ChartShell title={title} isEmpty={data.length === 0} empty={`No ${dataKey} data recorded yet.`}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="date" tickFormatter={shortDate} {...axisProps} />
        <YAxis domain={[0, 'auto']} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => shortDate(String(label))} formatter={(v) => [`${v} ${unit}`, dataKey]} />
        <ReferenceLine y={target} stroke="var(--chart-4)" strokeDasharray="4 4" label={{ value: `Target ${target}${unit}`, fontSize: 10, fill: 'currentColor' }} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} connectNulls />
      </LineChart>
    </ChartShell>
  )
}

export function CaloriesTargetChart({
  data,
  target,
}: {
  data: { date: string; calories: number | null; target: number }[]
  target: number
}) {
  return (
    <TargetLineChart
      title="Calories vs target (kcal)"
      data={data}
      dataKey="calories"
      target={target}
      color="var(--chart-1)"
      unit=""
    />
  )
}

export function ProteinTargetChart({
  data,
  target,
}: {
  data: { date: string; protein: number | null; target: number }[]
  target: number
}) {
  return (
    <TargetLineChart
      title="Protein vs target (g)"
      data={data}
      dataKey="protein"
      target={target}
      color="var(--chart-4)"
      unit="g"
    />
  )
}

export function StepsSleepChart({ data }: { data: { date: string; steps: number | null; sleep: number | null }[] }) {
  return (
    <ChartShell title="Steps & sleep" isEmpty={data.length === 0} empty="Log steps and sleep in the Daily Log.">
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="date" tickFormatter={shortDate} {...axisProps} />
        <YAxis yAxisId="left" {...axisProps} />
        <YAxis yAxisId="right" orientation="right" {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => shortDate(String(label))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line yAxisId="left" type="monotone" dataKey="steps" name="Steps" stroke="var(--chart-2)" strokeWidth={2} connectNulls dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="sleep" name="Sleep (h)" stroke="var(--chart-3)" strokeWidth={2} connectNulls />
      </LineChart>
    </ChartShell>
  )
}

export function WorkoutCompletionChart({ data }: { data: { week: string; completion: number | null }[] }) {
  return (
    <ChartShell title="Workout completion by week (%)" isEmpty={data.length === 0} empty="Log workouts to track completion.">
      <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="week" {...axisProps} />
        <YAxis domain={[0, 100]} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Completion']} />
        <Bar dataKey="completion" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={(entry.completion ?? 0) >= 100 ? 'var(--chart-4)' : 'var(--chart-1)'} />
          ))}
        </Bar>
      </BarChart>
    </ChartShell>
  )
}

export function EnergyFaceChart({
  data,
}: {
  data: { date: string; energy: number | null; faceSkin: number | null }[]
}) {
  return (
    <ChartShell title="Energy & face/skin ratings (1–5)" isEmpty={data.length === 0} empty="Rate your energy and face/skin daily.">
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="date" tickFormatter={shortDate} {...axisProps} />
        <YAxis domain={[0, 5]} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => shortDate(String(label))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="energy" name="Energy" stroke="var(--chart-2)" strokeWidth={2} connectNulls />
        <Line type="monotone" dataKey="faceSkin" name="Face/skin" stroke="var(--chart-5)" strokeWidth={2} connectNulls />
      </LineChart>
    </ChartShell>
  )
}

export function StrengthChart({
  data,
}: {
  data: { exercise: string; points: { date: string; topWeight: number | null; volume: number | null }[] }[]
}) {
  const isEmpty = data.length === 0
  return (
    <ChartShell title="Strength progression – top set weight (kg)" isEmpty={isEmpty} empty="Record workout sets to see strength trends.">
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis
          dataKey="date"
          type="category"
          allowDuplicatedCategory={false}
          tickFormatter={shortDate}
          {...axisProps}
        />
        <YAxis domain={['auto', 'auto']} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => shortDate(String(label))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {data.map((series, i) => (
          <Line
            key={series.exercise}
            data={series.points}
            dataKey="topWeight"
            name={series.exercise}
            stroke={`var(--chart-${(i % 5) + 1})`}
            strokeWidth={2}
            connectNulls
          />
        ))}
      </LineChart>
    </ChartShell>
  )
}