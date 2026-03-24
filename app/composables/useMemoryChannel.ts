// composables/useMemoryChannel.ts
import type { Memory, Comment, ReactionType } from '~/types/kenangan'

type MemoryEvent =
  | { type: 'created'; memory: Memory }
  | { type: 'updated'; memory: Memory }
  | { type: 'deleted'; id: string }
  | { type: 'pin_toggled'; id: string; is_pinned: boolean }
  | { type: 'media_added'; memoryId: string }
  | { type: 'media_deleted'; memoryId: string; mediaId: string }
  | { type: 'comment_added'; memoryId: string; comment: Comment; parentId?: string }
  | { type: 'comment_deleted'; memoryId: string; commentId: string; removedTotal?: number; total?: number }
  | {
      type: 'reaction_toggled'
      memoryId: string
      reacted: boolean
      reactionType: ReactionType | null
      total: number
    }

type MemoryEnvelope = {
  senderId: string
  event: MemoryEvent
}

const CHANNEL_NAME = 'kenangan:memories'
const SENDER_KEY = 'kenangan:memories:sender-id'

const getSenderId = () => {
  if (!import.meta.client) return 'server'
  const saved = sessionStorage.getItem(SENDER_KEY)
  if (saved) return saved
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  sessionStorage.setItem(SENDER_KEY, id)
  return id
}

export const useMemoryChannel = () => {
  const senderId = getSenderId()

  const broadcast = (event: MemoryEvent) => {
    if (!import.meta.client || !('BroadcastChannel' in window)) return
    const ch = new BroadcastChannel(CHANNEL_NAME)
    const payload: MemoryEnvelope = { senderId, event }
    ch.postMessage(payload)
    ch.close()
  }

  const listen = (handler: (event: MemoryEvent) => void) => {
    if (!import.meta.client || !('BroadcastChannel' in window)) return () => {}
    const ch = new BroadcastChannel(CHANNEL_NAME)

    ch.onmessage = (e) => {
      const data = e.data as MemoryEnvelope | MemoryEvent

      // backward-compatible: kalau format lama (langsung event), tetap proses
      if (data && typeof data === 'object' && 'event' in data && 'senderId' in data) {
        if (data.senderId === senderId) return // ignore event dari tab sendiri
        handler(data.event)
        return
      }

      handler(data as MemoryEvent)
    }

    return () => ch.close()
  }

  return { broadcast, listen }
}