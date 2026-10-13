import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils/cn'

export function KpiCard({
  label,
  value,
  unit,
  delta,
  hint,
  icon,
  className,
}: {
  label: string
  value: ReactNode
  unit?: string
  delta?: number | null
  hint?: string
  icon?: ReactNode
  className?: string
}) {
  const deltaLabel =
    delta === null || delta === undefined
      ? null
      : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="flex min-w-0 flex-col gap-1 p-4">
        <div className="flex min-w-0 items-start justify-between gap-2 text-muted-foreground">
          <span className="min-w-0 break-words text-xs font-medium uppercase tracking-wide">{label}</span>
          {icon ? <span className="shrink-0">{icon}</span> : null}
        </div>
        <div className="flex min-w-0 flex-wrap items-baseline gap-1">
          <span className="min-w-0 break-words text-xl font-semibold tabular-nums sm:text-2xl">{value}</span>
          {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          {deltaLabel ? (
            <span
              className={cn(
                'text-xs font-medium',
                delta! > 0 ? 'text-chart-5' : delta! < 0 ? 'text-chart-4' : 'text-muted-foreground',
              )}
            >
              {deltaLabel}
            </span>
          ) : null}
          {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
        </div>
      </CardContent>
    </Card>
  )
}