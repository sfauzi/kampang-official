// composables/useSeoMeta.ts
// Lokasi: composables/useSeoMeta.ts
// Fungsi: Helper terpusat untuk set SEO Meta + OpenGraph di setiap halaman

import type { Memory, Album, Group } from '~/types/kenangan'
import type { UserBrief } from '~/types/kenangan'

export const useSeoMetaHelper = () => {
  const config = useRuntimeConfig()
  const apiBase = (config.public.apiBase as string).replace(/\/api$/, '')

  // Default metadata
  const defaultMeta = {
    title: 'Kampang Official',
    description: 'Platform untuk berbagi cerita, pengalaman, dan pemikiran. Bergabunglah dengan komunitas kami dan temukan berbagai cerita menarik dari seluruh dunia.',
    image: 'https://kampangofficial.vercel.app/logo-ko.png',
    url: 'https://kampangofficial.vercel.app',
  }

  // ── Memory page ──
  const setMemorySeo = (memory: Memory | null) => {
    if (!memory) return

    const title = `${memory.title || 'Kenangan'} | Kampang Official`
    const description = (memory.caption || '').substring(0, 160) || 'Bagikan momen berharga di Kampang Official'
    const image = memory.media?.[0]?.url || memory.media?.[0]?.thumbnail_url || defaultMeta.image
    const url = `https://kampangofficial.vercel.app/memories/${memory.id}`

    useSeoMeta({
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImage: image,
      ogUrl: url,
      ogType: 'article',
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: image,
    })
  }

  // ── Album page ──
  const setAlbumSeo = (album: Album | null) => {
    if (!album) return

    const title = `${album.title} | Kampang Official`
    const description = (album.description || '').substring(0, 160) || `Album: ${album.title}`
    const image = album.cover_media?.url || album.cover_media?.thumbnail_url || defaultMeta.image
    const url = `https://kampangofficial.vercel.app/albums/${album.id}`

    useSeoMeta({
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImage: image,
      ogUrl: url,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: image,
    })
  }

  // ── Group page ──
  const setGroupSeo = (group: Group | null) => {
    if (!group) return

    const title = `${group.name} | Kampang Official`
    const description = (group.description || '').substring(0, 160) || `Bergabunglah dengan grup: ${group.name}`
    const image = group.cover_image || defaultMeta.image
    const url = `https://kampangofficial.vercel.app/groups/${group.id}`

    useSeoMeta({
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImage: image,
      ogUrl: url,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: image,
    })
  }

  // ── User profile page ──
  const setUserSeo = (user: UserBrief | null) => {
    if (!user) return

    const title = `${user.name} | Profil | Kampang Official`
    const description = (user.description || '').substring(0, 160) || `Profil ${user.name} di Kampang Official`
    const image = user.avatar 
      ? `${apiBase}/storage/${user.avatar}` 
      : `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(user.name)}`
    const url = `https://kampangofficial.vercel.app/users/${user.id}`

    useSeoMeta({
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImage: image,
      ogUrl: url,
      ogType: 'profile',
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: image,
    })
  }

  // ── Default pages ──
  const setPageSeo = (title: string, description: string, route: string, image = defaultMeta.image) => {
    const fullTitle = `${title} | Kampang Official`
    const url = `https://kampangofficial.vercel.app${route}`

    useSeoMeta({
      title: fullTitle,
      description,
      ogTitle: fullTitle,
      ogDescription: description,
      ogImage: image,
      ogUrl: url,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: fullTitle,
      twitterDescription: description,
      twitterImage: image,
    })
  }

  return {
    setMemorySeo,
    setAlbumSeo,
    setGroupSeo,
    setUserSeo,
    setPageSeo,
    defaultMeta,
  }
}