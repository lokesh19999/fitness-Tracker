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
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
          {icon}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
        </div>
        <div className="flex items-center gap-2">
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