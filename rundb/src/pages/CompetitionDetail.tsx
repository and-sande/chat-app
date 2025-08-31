import { useParams, Link } from 'react-router-dom'
import { competitions, byId as compsById } from '../data/competitions'
import { runners } from '../data/runners'
import { formatSeconds, formatPace, formatDateISO } from '../lib/format'
import { paceSecPerKm } from '../lib/metrics'
import Hero from '../components/Hero'

export default function CompetitionDetail() {
  const { id } = useParams()
  const comp = compsById.get(id!)
  if (!comp) return <div className="panel">Competition not found.</div>

  const results = runners
    .flatMap(r => r.results.map(rr => ({ runner: r, res: rr })))
    .filter(x => x.res.competitionId === comp.id)
    .sort((a,b) => a.res.timeSec - b.res.timeSec)

  const times = results.map(r => r.res.timeSec)
  const avg = times.length ? Math.round(times.reduce((a,b)=>a+b,0) / times.length) : 0
  const win = times[0] ?? 0

  return (
    <div>
      {comp.imageUrl && (
        <div className="event-banner" style={{backgroundImage: `url(${comp.imageUrl})`}} aria-label={`${comp.name} banner`} />
      )}

      <Hero
        title={<span>{comp.name}</span>}
        subtitle={`${formatDateISO(comp.date)} · ${comp.location} · ${comp.distanceKm} km`}
        right={<div className="panel" style={{display:'grid', gap:8}}>
          <div><span className="muted">Winner</span><div style={{fontWeight:800}}>{formatSeconds(win)}</div></div>
          <div><span className="muted">Average</span><div style={{fontWeight:800}}>{formatSeconds(avg)}</div></div>
        </div>}
      />

      <div className="panel" style={{marginTop: 12}}>
        <div className="runner-meta">
          {comp.organizer && <span className="pill">🏟️ Organizer: {comp.organizer}</span>}
          {comp.homepage && <a className="pill link" href={comp.homepage} target="_blank" rel="noopener">🌐 Homepage</a>}
          <span className="pill">🏃 Participants: {results.length}</span>
        </div>
      </div>

      <div className="panel" style={{padding:0, marginTop: 12}}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Runner</th>
              <th>Time</th>
              <th>Pace</th>
            </tr>
          </thead>
          <tbody>
            {results.map((x, i) => (
              <tr key={x.runner.id+String(i)}>
                <td>{x.res.position}</td>
                <td><Link to={`/runner/${x.runner.id}`}>{x.runner.name}</Link></td>
                <td>{formatSeconds(x.res.timeSec)}</td>
                <td>{formatPace(paceSecPerKm(x.res.timeSec, comp.distanceKm))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
