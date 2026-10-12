import { useCallback, useEffect, useState } from 'react'

import { useOnline } from '@/hooks/use-online'
import { refetchAll } from '@/hooks/use-query'
import { flushQueue, pendingCount } from '@/lib/offline'

export function usePendingSync() {
  const online = useOnline()
  const [pending, setPending] = useState(0)
  const [flushing, setFlushing] = useState(false)

  const refresh = useCallback(async () => {
    setPending(await pendingCount())
  }, [])

  const flush = useCallback(async () => {
    if (!online) return { flushed: 0, remaining: pending, conflicts: 0 }
    setFlushing(true)
    try {
      const result = await flushQueue()
      setPending(result.remaining)
      if (result.flushed > 0) refetchAll()
      return result
    } finally {
      setFlushing(false)
    }
  }, [online, pending])

  useEffect(() => {
    void refresh()
    const interval = setInterval(() => void refresh(), 5000)
    return () => clearInterval(interval)
  }, [refresh])

  useEffect(() => {
    if (online) void flush()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online])

  return { online, pending, flushing, refresh, flush }
}