// types/kenangan.ts

// ─── Shared ───────────────────────────────────────────────────────────────────

export type Privacy = 'public' | 'group' | 'private'
export type Category = 'school' | 'hiking' | 'traveling' | 'other'
export type ReactionType = 'love' | 'haha' | 'wow' | 'sad' | 'nostalgic'

export interface Location {
  name: string | null
  latitude: number | null
  longitude: number | null
}

export interface PaginatedResponse<T> {
  data: T[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
  }
}

// ─── User (ringkas — untuk relasi) ───────────────────────────────────────────

export interface UserBrief {
  id: string
  name: string
  email: string
  avatar: string | null
  description: string | null
  address: string | null
  notes: string | null
  role: string
  memories_count?: number
  groups_count?: number
   albums_count?: number
  
  created_at: string
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string
  name: string
  slug: string
  type: 'category' | 'custom'
  color: string | null
}

// ─── Group ───────────────────────────────────────────────────────────────────

export type GroupMemberRole = 'owner' | 'admin' | 'member'
export type GroupMemberStatus = 'pending' | 'active' | 'banned'

export interface Group {
  id: string
  name: string
  slug: string
  description: string | null
  cover_image: string | null
  category: Category
  privacy: 'public' | 'closed' | 'private'
  location: Location
  creator?: UserBrief
  members?: UserBrief[]
  members_count?: number
  memories_count?: number
  albums_count?: number
  my_role?: GroupMemberRole
  my_status?: GroupMemberStatus
  created_at: string
}

export interface StoreGroupPayload {
  name: string
  description?: string | null
  cover_image?: File | null
  category: Category
  privacy: 'public' | 'closed' | 'private'
  location_name?: string | null
  latitude?: number | null
  longitude?: number | null
}

// ─── Album ───────────────────────────────────────────────────────────────────

export type ContributorStatus = 'pending' | 'accepted' | 'declined'

export interface Album {
  id: string
  title: string
  description: string | null
  event_date: string | null
  event_end_date: string | null
  category: Category
  privacy: Privacy
  is_collaborative: boolean
  location: Location
  cover_media?: MemoryMedia | null
  creator?: UserBrief
  group?: Group | null
  contributors?: UserBrief[]
  memories?: Memory[]
  tags?: Tag[]
  memories_count?: number
  contributors_count?: number
  contributor_status?: ContributorStatus
  created_at: string
  updated_at: string
}

export interface StoreAlbumPayload {
  title: string
  description?: string | null
  group_id?: string | null
  event_date?: string | null
  event_end_date?: string | null
  category: Category
  privacy: Privacy
  is_collaborative?: boolean
  location_name?: string | null
  latitude?: number | null
  longitude?: number | null
  tag_ids?: string[]
  contributor_ids?: string[]
}

// ─── Memory Media ─────────────────────────────────────────────────────────────

export type MediaType = 'photo' | 'video'

export interface MemoryMedia {
  id: string
  type: MediaType
  url: string
  thumbnail_url: string | null
  caption: string | null
  order: number
  meta: {
    mime_type: string | null
    size: number | null
    width: number | null
    height: number | null
    duration: number | null
  }
  created_at: string
}

// ─── Memory ──────────────────────────────────────────────────────────────────

export interface Memory {
  id: string
  title: string | null
  caption: string | null
  memory_date: string
  category: Category
  privacy: Privacy
  is_pinned: boolean
  location: Location
  user?: UserBrief
  group?: Group | null
  album?: Album | null
  media?: MemoryMedia[]
  tags?: Tag[]
  tagged_users?: UserBrief[]
  comments?: Comment[]
  media_count?: number
  comments_count?: number
  reactions_count?: number
  my_reaction?: ReactionType | null
  created_at: string
  updated_at: string
}

export interface StoreMemoryPayload {
  title?: string | null
  caption?: string | null
  memory_date: string
  category: Category
  privacy: Privacy
  group_id?: string | null
  album_id?: string | null
  location_name?: string | null
  latitude?: number | null
  longitude?: number | null
  tag_ids?: string[]
  tagged_user_ids?: string[]
  media?: File[]
}

// ─── Comment ─────────────────────────────────────────────────────────────────

export interface Comment {
  id: string
  body: string
  parent_id: string | null
  user?: UserBrief
  replies?: Comment[]
  is_mine: boolean
  created_at: string
  updated_at: string
}

// ─── Reaction ────────────────────────────────────────────────────────────────

export interface ReactionSummary {
  total: number
  summary: Partial<Record<ReactionType, number>>
  reactions?: Array<{
    id?: string
    type: ReactionType
    user: Pick<UserBrief, 'id' | 'name' | 'avatar'>
    created_at?: string
  }>
  reactors?: Array<{
    user: Pick<UserBrief, 'id' | 'name' | 'avatar'>
    type: ReactionType
    reacted_at?: string
  }>
}

// ─── Map Pin ─────────────────────────────────────────────────────────────────

export type IconType = 'school' | 'mountain' | 'city' | 'beach' | 'forest' | 'landmark' | 'camp' | 'other'

export interface MapPin {
  id: string
  label: string | null
  location_name: string
  latitude: number
  longitude: number
  icon_type: IconType
  color: string | null
  memory?: Memory | null
  album?: Album | null
  group?: Group | null
  created_at: string
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchResults {
  query: string
  results: {
    memories?: Memory[]
    albums?: Album[]
    groups?: Group[]
    users?: UserBrief[]
  }
}