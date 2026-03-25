// composables/useFormatDate.ts
export const useFormatDate = () => {
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '-'

    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'

    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Contoh output: "23 Mar 2026"
  const formatDateShort = (date: string | Date | null | undefined): string => {
    return formatDate(date)
  }

  // Contoh output: "Senin, 23 Maret 2026"
  const formatDateLong = (date: string | Date | null | undefined): string => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'

    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Contoh output: "23 Maret 2026"
  const formatDateFull = (date: string | Date | null | undefined): string => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'

    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatCommentTime = (input?: string | null): string => {
    if (!input) return '-'

    // Ambil apa adanya dari backend: YYYY-MM-DD HH:mm:ss / YYYY-MM-DDTHH:mm:ss
    const m = String(input).match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/
    )

    if (m) {
      const [, yyyy, mm, dd, hh, mi, ss = '00'] = m
      const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      const month = monthShort[Math.max(0, Math.min(11, Number(mm) - 1))] ?? mm
      // fixed: "25 Mar 2026, 03:08:26" (tanpa geser timezone)
      return `${dd} ${month} ${yyyy}, ${hh}:${mi}:${ss}`
    }

    // fallback jika format lain
    return String(input)
  }

  return {
    formatDate,
    formatDateShort,
    formatDateLong,
    formatDateFull,
    formatCommentTime,
  }
}