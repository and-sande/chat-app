import { Link, useParams } from 'react-router-dom'
import { runners } from '../data/runners'
import { byId as compsById } from '../data/competitions'
import Badge from '../components/Badge'
import { computeBadges } from '../lib/badges'
import { bestTimeAtDistanceSec, paceSecPerKm } from '../lib/metrics'
import { formatSeconds, formatPace } from '../lib/format'
import Sparkline from '../components/Sparkline'
import Avatar from '../components/Avatar'
import Hero from '../components/Hero'

export default function RunnerProfile() {
  const { id } = useParams()
  const runner = runners.find(r => r.id === id)
  if (!runner) return <div className="panel">Runner not found.</div>
  const badges = computeBadges(runner)
  const sorted = [...runner.results].sort((a,b) => b.date.localeCompare(a.date))
  const paceSeries = [...runner.results]
    .sort((a,b)=> a.date.localeCompare(b.date))
    .map(r => {
      const comp = compsById.get(r.competitionId)
      return paceSecPerKm(r.timeSec, comp?.distanceKm ?? 1)
    })

  const totalRaces = sorted.length
  const podiums = sorted.filter(r => r.position > 0 && r.position <= 3).length
  const lastRace = sorted[0]

  const best5k = bestTimeAtDistanceSec(runner, 5)
  const best10k = bestTimeAtDistanceSec(runner, 10)
  return (
    <div>
      <Hero
        title={<span className="row" style={{gap:12}}><Avatar name={runner.name} src={runner.avatarUrl} size={88} /> {runner.name}</span>}
        subtitle={<span>{runner.club ?? 'Independent'} · {runner.country ?? '—'}</span>}
        right={<div className="row">{badges.map(b => <Badge key={b.id} label={b.label} icon={b.icon} tone={b.tone} />)}</div>}
      />

      <div className="kpi" style={{marginTop: 12}}>
        <div className="item"><div className="label">Total races</div><div className="value">{totalRaces}</div></div>
        <div className="item"><div className="label">Best 5K</div><div className="value">{best5k ? formatSeconds(best5k) : '—'}</div></div>
        <div className="item"><div className="label">Best 10K</div><div className="value">{best10k ? formatSeconds(best10k) : '—'}</div></div>
      </div>

      <div className="panel" style={{marginTop: 14}}>
        <div className="row" style={{justifyContent:'space-between'}}>
          <div>
            <div className="muted">Pace trend</div>
            <div style={{fontWeight:800, fontSize:18}}>{paceSeries.length ? formatPace(paceSeries[paceSeries.length-1]) : '—'}</div>
          </div>
          <Sparkline values={paceSeries} width={420} height={80} />
        </div>
      </div>

      <h3 style={{marginTop: 18}}>Race history</h3>
      <div className="panel" style={{padding:0}}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Competition</th>
              <th>Distance</th>
              <th>Time</th>
              <th>Pace</th>
              <th>Pos</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((res, i) => {
              const comp = compsById.get(res.competitionId)
              return (
                <tr key={i}>
                  <td>{res.date}</td>
                  <td><Link to={`/competitions#${comp?.id}`}>{comp?.name}</Link></td>
                  <td>{comp?.distanceKm} km</td>
                  <td>{formatSeconds(res.timeSec)}</td>
                  <td>{comp ? formatPace(paceSecPerKm(res.timeSec, comp.distanceKm)) : '—'}</td>
                  <td>{res.position}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
