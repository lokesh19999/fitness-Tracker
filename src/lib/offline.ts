import Dexie, { type Table } from 'dexie'

import { supabase } from './supabase'

export type MutationOp = 'insert' | 'update' | 'delete'

export interface PendingMutation {
  localId?: number
  table: string
  op: MutationOp
  /** Row payload. For delete only `id` is required. */
  payload: Record<string, unknown>
  userId: string
  /** Client timestamp baseline used for conflict detection. */
  baseline: number
  createdAt: number
  attempts: number
  lastError?: string
}

export interface LocalDraft {
  key: string
  table: string
  payload: Record<string, unknown>
  userId: string
  updatedAt: number
}

class OfflineDB extends Dexie {
  mutations!: Table<PendingMutation, number>
  drafts!: Table<LocalDraft, string>

  constructor() {
    super('goddess-physique-offline')
    this.version(1).stores({
      mutations: '++localId, table, userId, createdAt',
      drafts: 'key, table, userId, updatedAt',
    })
  }
}

export const offlineDb = new OfflineDB()

/**
 * Loose view of the Supabase client used only for dynamic-table replay.
 * Keeps the queue generic without weakening the typed client elsewhere.
 */
interface LooseQuery {
  eq: (column: string, value: string) => LooseQuery
  maybeSingle: () => Promise<{ data: { updated_at?: string } | null; error: unknown }>
  then: Promise<{ error: unknown }>['then']
}
interface LooseClient {
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => Promise<{ error: unknown }>
    update: (payload: Record<string, unknown>) => LooseQuery
    delete: () => LooseQuery
    select: (columns: string) => LooseQuery
  }
}
const sb = supabase as unknown as LooseClient

export async function enqueueMutation(
  mutation: Omit<PendingMutation, 'localId' | 'createdAt' | 'attempts'>,
) {
  return offlineDb.mutations.add({ ...mutation, createdAt: Date.now(), attempts: 0 })
}

export async function pendingCount(): Promise<number> {
  return offlineDb.mutations.count()
}

export async function saveDraft(draft: Omit<LocalDraft, 'updatedAt'>) {
  return offlineDb.drafts.put({ ...draft, updatedAt: Date.now() })
}

export async function getDraft(key: string): Promise<LocalDraft | undefined> {
  return offlineDb.drafts.get(key)
}

export async function deleteDraft(key: string) {
  return offlineDb.drafts.delete(key)
}

export interface FlushResult {
  flushed: number
  remaining: number
  conflicts: number
}

/**
 * Replays queued mutations against Supabase. For updates we first read the
 * server row's updated_at and skip (as a conflict) when the server copy is
 * newer than the client baseline — never silently overwrite fresher data.
 */
export async function flushQueue(): Promise<FlushResult> {
  const pending = await offlineDb.mutations.orderBy('createdAt').toArray()
  let flushed = 0
  let conflicts = 0

  for (const mutation of pending) {
    try {
      if (mutation.op === 'insert') {
        const { error } = await sb.from(mutation.table).insert(mutation.payload)
        if (error) throw error
      } else if (mutation.op === 'update') {
        const id = mutation.payload.id as string
        const { data: serverRow, error: readError } = await sb
          .from(mutation.table)
          .select('updated_at')
          .eq('id', id)
          .maybeSingle()
        if (readError) throw readError
        const serverUpdatedAt = serverRow?.updated_at
          ? new Date(serverRow.updated_at).getTime()
          : 0
        if (serverUpdatedAt > mutation.baseline) {
          conflicts += 1
          await offlineDb.mutations.delete(mutation.localId!)
          continue
        }
        const { error } = await sb.from(mutation.table).update(mutation.payload).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await sb
          .from(mutation.table)
          .delete()
          .eq('id', mutation.payload.id as string)
        if (error) throw error
      }
      await offlineDb.mutations.delete(mutation.localId!)
      flushed += 1
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sync failed'
      await offlineDb.mutations.update(mutation.localId!, {
        attempts: mutation.attempts + 1,
        lastError: message,
      })
    }
  }

  return { flushed, remaining: await offlineDb.mutations.count(), conflicts }
}