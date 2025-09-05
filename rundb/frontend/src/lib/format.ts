export function formatSeconds(total: number) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}` : `${m}:${s.toString().padStart(2,'0')}`
}

export function formatPace(secPerKm: number) {
  const m = Math.floor(secPerKm / 60)
  const s = secPerKm % 60
  return `${m}:${s.toString().padStart(2,'0')}/km`
}

export function formatDateISO(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

// 18. aug 2025 (Norwegian short month, lower-case)
export function formatDateNOShort(iso: string) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const day = d.getDate().toString().padStart(2, '0')
    const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    return `${day}. ${month} ${year}`
  } catch {
    return iso
  }
}

// 06. september (Norwegian full month, lower-case, no year)
export function formatDateNODayMonth(iso: string) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const day = d.getDate().toString().padStart(2, '0')
    const months = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember']
    const month = months[d.getMonth()]
    return `${day}. ${month}`
  } catch {
    return iso
  }
}
