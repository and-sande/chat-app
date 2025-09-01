import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatDateISO, formatPace, formatSeconds } from '../lib/format'
import { api, type Event as APIEvent } from '../lib/api'
import Hero from '../components/Hero'

export default function CompetitionDetail() {
  const { id } = useParams()
  const [comp, setComp] = useState<APIEvent | null>(null)
  const [results, setResults] = useState<any[]>([])
  useEffect(() => {
    let mounted = true
    if (!id) return
    api.event(id).then(setComp).catch(()=> setComp(null))
    api.eventResults(id).then(r => { if (mounted) setResults(r) }).catch(()=>{})
    return () => { mounted = false }
  }, [id])
  if (!comp) return <div className="panel">Competition not found.</div>

  const times = useMemo(() => results.map(r => r.time_sec).filter(Boolean) as number[], [results])
  const avg = times.length ? Math.round(times.reduce((a,b)=>a+b,0) / times.length) : 0
  const win = times.length ? times[0] : 0
  const paceSecPerKm = (timeSec: number, km?: number | null) => {
    if (!km || !isFinite(km)) return timeSec
    return Math.round(timeSec / km)
  }

  return (
    <div>
      {comp.image_url && (
        <div className="event-banner" style={{backgroundImage: `url(${comp.image_url})`}} aria-label={`${comp.name} banner`} />
      )}

      <Hero
        title={<span>{comp.name}</span>}
        subtitle={`${formatDateISO(comp.date)}${comp.start_time ? ` ${comp.start_time}` : ''}${comp.location_city ? ` · ${comp.location_city}` : ''}${comp.location_country ? `, ${comp.location_country}` : ''}${typeof comp.distance_km === 'number' ? ` · ${comp.distance_km} km` : ''}`}
        right={<div className="panel" style={{display:'grid', gap:8}}>
          <div><span className="muted">Winner</span><div style={{fontWeight:800}}>{formatSeconds(win)}</div></div>
          <div><span className="muted">Average</span><div style={{fontWeight:800}}>{formatSeconds(avg)}</div></div>
        </div>}
      />

      <div className="panel" style={{marginTop: 12}}>
        <div className="runner-meta">
          {comp.organizer && <span className="pill">🏟️ Organizer: {comp.organizer}</span>}
          {comp.homepage && <a className="pill link" href={comp.homepage} target="_blank" rel="noopener">🌐 Homepage</a>}
          <span className="pill">🏃 Results: {results.length}</span>
          {comp.sport && <span className="pill">🏅 Sport: {comp.sport}</span>}
          {comp.level && <span className="pill">📈 Level: {comp.level}</span>}
          {comp.signup_begin && <span className="pill">📝 Signup: {new Date(comp.signup_begin).toLocaleDateString()} – {comp.signup_end ? new Date(comp.signup_end).toLocaleDateString() : '—'}</span>}
        </div>
      </div>

      {comp.races && comp.races.length > 0 && (
        <div className="panel" style={{marginTop: 12}}>
          <h3 style={{marginTop:0}}>Races</h3>
          <ul>
            {comp.races.map((r,i) => (
              <li key={i}>{r.name}{r.start_time ? ` · ${r.start_time}` : ''}</li>
            ))}
          </ul>
        </div>
      )}

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
              <tr key={x.id ?? i}>
                <td>{x.finish ?? ''}</td>
                <td>{x.runner_id ? <a href={`/runner/${x.runner_id}`}>{x.name ?? ''}</a> : (x.name ?? '')}</td>
                <td>{x.time ?? (x.time_sec ? formatSeconds(x.time_sec) : '')}</td>
                <td>{typeof comp.distance_km === 'number' && x.time_sec ? formatPace(paceSecPerKm(x.time_sec, comp.distance_km)) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
