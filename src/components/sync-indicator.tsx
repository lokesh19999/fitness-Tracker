import { Cloud, CloudOff, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePendingSync } from '@/hooks/use-pending-sync'
import { cn } from '@/utils/cn'

export function SyncIndicator({ onRefresh }: { onRefresh?: () => void }) {
  const { online, pending, flushing, flush } = usePendingSync()

  const status = !online
    ? { label: 'Offline', tone: 'text-amber-500', icon: <CloudOff className="h-4 w-4" /> }
    : pending > 0
      ? { label: `${pending} pending`, tone: 'text-amber-500', icon: <Cloud className="h-4 w-4" /> }
      : { label: 'Synced', tone: 'text-chart-4', icon: <Cloud className="h-4 w-4" /> }

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => void flush()}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
              status.tone,
            )}
            aria-label={`Cloud sync status: ${status.label}`}
          >
            {flushing ? <RefreshCw className="h-4 w-4 animate-spin" /> : status.icon}
            <span className="hidden sm:inline">{status.label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {online
            ? pending > 0
              ? `${pending} change(s) waiting to sync. Tap to retry.`
              : 'All changes saved to the cloud.'
            : 'You are offline. Changes are stored locally and will sync on reconnect.'}
        </TooltipContent>
      </Tooltip>
      {onRefresh ? (
        <Button variant="ghost" size="icon" onClick={onRefresh} aria-label="Refresh data">
          <RefreshCw className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}