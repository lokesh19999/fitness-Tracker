import { useCallback, useEffect, useRef, useState } from 'react'

interface CacheEntry {
  data: unknown
  updatedAt: number
  error: string | null
}

const cache = new Map<string, CacheEntry>()
const subscribers = new Map<string, Set<() => void>>()
const refetchers = new Set<() => void>()

function notify(key: string) {
  subscribers.get(key)?.forEach((fn) => fn())
}

function subscribe(key: string, fn: () => void) {
  if (!subscribers.has(key)) subscribers.set(key, new Set())
  subscribers.get(key)!.add(fn)
  return () => {
    subscribers.get(key)?.delete(fn)
  }
}

/** Invalidate one key or every key with the given prefix, triggering refetch. */
export function invalidate(prefix: string) {
  const keys = new Set<string>([...cache.keys(), ...subscribers.keys()])
  for (const key of keys) {
    if (key === prefix || key.startsWith(`${prefix}:`)) {
      const existing = cache.get(key)
      if (existing) cache.set(key, { ...existing, error: null })
      notify(key)
    }
  }
}

export function clearQueryCache() {
  cache.clear()
}

/** Refetch every currently mounted query (used on window focus / reconnect). */
export function refetchAll() {
  refetchers.forEach((fn) => fn())
}

export interface QueryResult<T> {
  data: T | undefined
  error: string | null
  loading: boolean
  fetching: boolean
  updatedAt: number | undefined
  refetch: () => void
}

/**
 * Minimal cached query hook: keeps previous data while refetching, exposes
 * loading/error state, and participates in global focus/reconnect refetching.
 */
export function useQuery<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  opts?: { enabled?: boolean },
): QueryResult<T> {
  const enabled = opts?.enabled !== false && key !== null
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const [state, setState] = useState<{
    data?: T
    error: string | null
    loading: boolean
    fetching: boolean
    updatedAt?: number
  }>(() => {
    const cached = key ? cache.get(key) : undefined
    return {
      data: cached?.data as T | undefined,
      error: cached?.error ?? null,
      loading: Boolean(enabled) && cached === undefined,
      fetching: false,
      updatedAt: cached?.updatedAt,
    }
  })

  const run = useCallback(
    async (showLoading: boolean) => {
      if (!enabled || !key) return
      setState((s) => ({
        ...s,
        loading: showLoading && s.data === undefined,
        fetching: true,
        error: null,
      }))
      try {
        const data = await fetcherRef.current()
        const updatedAt = Date.now()
        cache.set(key, { data, updatedAt, error: null })
        setState({ data, error: null, loading: false, fetching: false, updatedAt })
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Request failed'
        const existing = cache.get(key)
        cache.set(key, { data: existing?.data, updatedAt: existing?.updatedAt ?? 0, error: message })
        setState((s) => ({ ...s, error: message, loading: false, fetching: false }))
      }
    },
    [enabled, key],
  )

  useEffect(() => {
    if (!enabled || !key) return
    const cached = cache.get(key)
    if (cached && cached.data !== undefined) {
      setState({
        data: cached.data as T,
        error: cached.error,
        loading: false,
        fetching: true,
        updatedAt: cached.updatedAt,
      })
    }
    void run(cached === undefined)
  }, [key, enabled, run])

  useEffect(() => {
    if (!key) return
    return subscribe(key, () => {
      const cached = cache.get(key)
      if (cached) {
        setState((s) => ({ ...s, data: cached.data as T, updatedAt: cached.updatedAt }))
      }
      void run(false)
    })
  }, [key, run])

  const refetch = useCallback(() => {
    void run(false)
  }, [run])

  useEffect(() => {
    if (!enabled) return
    const fn = () => void run(false)
    refetchers.add(fn)
    return () => {
      refetchers.delete(fn)
    }
  }, [enabled, run])

  const result: QueryResult<T> = {
    data: state.data,
    error: state.error,
    loading: state.loading,
    fetching: state.fetching,
    updatedAt: state.updatedAt,
    refetch,
  }
  return result
}