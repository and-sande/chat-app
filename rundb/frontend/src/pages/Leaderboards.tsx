import { useMemo, useState } from 'react'
import { runners } from '../data/runners'
import { bestTimeAtDistanceSec, racesInDays, totalRaces } from '../lib/metrics'
import { computeBadges, formatSeconds } from '../lib/badges'

type Metric = 'most-active' | 'best-time'

export default function Leaderboards() {
  const [metric, setMetric] = useState<Metric>('most-active')
  const [days, setDays] = useState<number>(90)
  const [distance, setDistance] = useState<number | 'any'>(5)

  const data = useMemo(() => {
    if (metric === 'most-active') {
      return [...runners]
        .map(r => ({
          runner: r,
          value: days === Infinity ? totalRaces(r) : racesInDays(r, days).length,
          note: days === Infinity ? `${totalRaces(r)} races total` : `${racesInDays(r, days).length} races last ${days}d`,
        }))
        .sort((a,b) => b.value - a.value)
    }
    // best-time
    const dist = distance === 'any' ? 5 : distance
    return [...runners]
      .map(r => ({
        runner: r,
        value: bestTimeAtDistanceSec(r, dist) ?? Number.POSITIVE_INFINITY,
        note: bestTimeAtDistanceSec(r, dist) ? `${dist}K PB` : '—',
      }))
      .sort((a,b) => a.value - b.value)
  }, [metric, days, distance])

  return (
    <div>
      <h2>Leaderboards</h2>
      <p className="muted">Filter by metric, time window, and distance to explore standout athletes.</p>

      <div className="controls panel" style={{display:'flex', gap:12, alignItems:'center'}}>
        <div className="row" style={{gap:8}}>
          <button className={`chip ${metric==='most-active'?'selected':''}`} onClick={() => setMetric('most-active')}>Most Active</button>
          <button className={`chip ${metric==='best-time'?'selected':''}`} onClick={() => setMetric('best-time')}>Best Time</button>
        </div>

        {metric === 'most-active' && (
          <div className="row" style={{gap:8}}>
            <label className="muted">Window</label>
            <select className="input" style={{width: 140}} value={String(days)} onChange={(e)=> setDays(e.target.value === 'Infinity' ? Infinity : Number(e.target.value))}>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 365 days</option>
              <option value="Infinity">All time</option>
            </select>
          </div>
        )}

        {metric === 'best-time' && (
          <div className="row" style={{gap:8}}>
            <label className="muted">Distance</label>
            <select className="input" style={{width: 140}} value={String(distance)} onChange={(e)=> setDistance(e.target.value === 'any' ? 'any' : Number(e.target.value))}>
              <option value="5">5K</option>
              <option value="10">10K</option>
              <option value="21.0975">Half</option>
            </select>
          </div>
        )}
      </div>

      <div className="panel" style={{padding:0, marginTop: 12}}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Runner</th>
              <th>Club</th>
              <th>Badges</th>
              <th style={{textAlign:'right'}}>{metric === 'most-active' ? 'Races' : 'Best Time'}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.runner.id}>
                <td>{i+1}</td>
                <td>{row.runner.name}</td>
                <td className="muted">{row.runner.club ?? 'Independent'}</td>
                <td>
                  {computeBadges(row.runner).slice(0,2).map(b => (
                    <span key={b.id} className={`badge ${b.tone ?? 'default'}`} style={{marginRight:6}}>{b.icon} {b.label}</span>
                  ))}
                </td>
                <td style={{textAlign:'right'}}>
                  {metric === 'most-active' ? row.value : (row.value === Number.POSITIVE_INFINITY ? '—' : formatSeconds(row.value))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

