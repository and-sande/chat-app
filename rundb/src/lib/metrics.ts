import type { Runner } from '../data/types'
import { byId as compsById } from '../data/competitions'

export function racesInDays(runner: Runner, days: number, now = new Date('2025-08-30')) {
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  return runner.results.filter(r => new Date(r.date) >= cutoff)
}

export function bestTimeAtDistanceSec(runner: Runner, distanceKm: number) {
  const times = runner.results
    .map(rr => ({ rr, comp: compsById.get(rr.competitionId)! }))
    .filter(x => Math.abs(x.comp.distanceKm - distanceKm) < 0.6)
    .map(x => x.rr.timeSec)
  return times.length ? Math.min(...times) : undefined
}

export function totalRaces(runner: Runner) {
  return runner.results.length
}

export function paceSecPerKm(timeSec: number, distanceKm: number) {
  if (!distanceKm || !isFinite(distanceKm)) return timeSec
  return Math.round(timeSec / distanceKm)
}

export function podiumsCount(runner: Runner) {
  return runner.results.filter(r => r.position > 0 && r.position <= 3).length
}

export function popularityScore(runner: Runner) {
  // Simple demo score: races + 2x podiums
  return totalRaces(runner) + podiumsCount(runner) * 2
}
