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

  return {
    formatDate,
    formatDateShort,
    formatDateLong,
    formatDateFull,
  }
}