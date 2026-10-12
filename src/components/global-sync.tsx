import { useEffect } from 'react'

import { usePendingSync } from '@/hooks/use-pending-sync'
import { refetchAll } from '@/hooks/use-query'

/**
 * Keeps cloud data fresh across devices: refetches when the tab regains focus
 * or the browser comes back online, and flushes any queued offline mutations.
 */
export function GlobalSync() {
  const { flush } = usePendingSync()

  useEffect(() => {
    const onFocus = () => {
      refetchAll()
      void flush()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [flush])

  return null
}