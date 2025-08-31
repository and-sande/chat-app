import { Link } from 'react-router-dom'
import type { Runner } from '../data/types'
import { computeBadges } from '../lib/badges'
import { podiumsCount, popularityScore } from '../lib/metrics'
import { byId as compsById } from '../data/competitions'
import { formatDateISO } from '../lib/format'
import Badge from './Badge'
import Avatar from './Avatar'

export default function RunnerCard({ runner }: { runner: Runner }) {
  const badges = computeBadges(runner)
  const races = runner.results.length
  const podiums = podiumsCount(runner)
  const pop = popularityScore(runner)
  const last = [...runner.results].sort((a,b) => b.date.localeCompare(a.date))[0]
  const lastComp = last ? compsById.get(last.competitionId) : undefined
  return (
    <Link to={`/runner/${runner.id}`} className="runner-card" style={{textDecoration:'none', color:'inherit'}}>
      <div className="card-left">
        <Avatar name={runner.name} src={runner.avatarUrl} size={56} />
        <div className="card-text">
          <div className="runner-title">{runner.name}</div>
          <div className="runner-meta">
            <span>{runner.club ?? 'Independent'}</span>
            <span>· {races} runs</span>
            <span>· {podiums} podiums</span>
            <span>· ★ {pop}</span>
            {last && (
              <span className="meta-pill">Last: {lastComp?.name ?? '—'} • {formatDateISO(last.date)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="card-right">
        {badges.slice(0,2).map(b => (
          <Badge key={b.id} label={b.label} tone={b.tone} icon={b.icon} />
        ))}
      </div>
    </Link>
  )
}
