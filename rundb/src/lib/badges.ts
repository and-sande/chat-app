import type { Runner } from '../data/types'
import { racesInDays, bestTimeAtDistanceSec } from './metrics'

export type ComputedBadge = { id: string; label: string; icon?: string; tone?: 'default'|'success'|'warn' }

// uses shared metrics helpers

export function computeBadges(runner: Runner): ComputedBadge[] {
  const out: ComputedBadge[] = []

  // Active: 3+ races in last 90 days
  if (racesInDays(runner, 90).length >= 3) out.push({ id: 'active', label: 'Active Runner', icon: '🔥', tone: 'success' })

  // Podium: any top 3
  if (runner.results.some(r => r.position > 0 && r.position <= 3)) out.push({ id: 'podium', label: 'Podium Finisher', icon: '🏅', tone: 'success' })

  // Speedster: 5K < 20:00 or 10K < 40:00
  const best5k = bestTimeAtDistanceSec(runner, 5)
  const best10k = bestTimeAtDistanceSec(runner, 10)
  if ((best5k && best5k < 20*60) || (best10k && best10k < 40*60)) out.push({ id: 'speed', label: 'Speedster', icon: '⚡️' })

  // Consistent: 4+ races this season
  if (runner.results.length >= 4) out.push({ id: 'consistent', label: 'Consistent', icon: '📅' })

  return out
}

export function formatSeconds(total: number) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}` : `${m}:${s.toString().padStart(2,'0')}`
}
