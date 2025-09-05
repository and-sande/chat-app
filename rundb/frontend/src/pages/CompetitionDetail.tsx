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
  // compute memoized data regardless of comp to keep hook order stable
  const times = useMemo(() => results.map(r => r.time_sec).filter(Boolean) as number[], [results])
  const avg = times.length ? Math.round(times.reduce((a,b)=>a+b,0) / times.length) : 0
  const win = times.length ? times[0] : 0
  const paceSecPerKm = (timeSec: number, km?: number | null) => {
    if (!km || !isFinite(km)) return timeSec
    return Math.round(timeSec / km)
  }
  const parseTimeToSeconds = (t?: string | null): number | null => {
    if (!t) return null
    const parts = String(t).trim().split(':').map(x => x.trim())
    if (parts.some(p => p === '' || isNaN(Number(p)))) return null
    let h = 0, m = 0, s = 0
    if (parts.length === 3) { h = Number(parts[0]); m = Number(parts[1]); s = Number(parts[2]) }
    else if (parts.length === 2) { m = Number(parts[0]); s = Number(parts[1]) }
    else if (parts.length === 1) { s = Number(parts[0]) }
    else return null
    const total = h*3600 + m*60 + s
    return Number.isFinite(total) ? total : null
  }

  if (!comp) return <div className="panel">Loading competition…</div>

  // compute winner time (in seconds) for behind column
  const timeToSec = (r: any): number | null => {
    if (typeof r?.time_sec === 'number') return r.time_sec
    if (r?.time) return parseTimeToSeconds(r.time)
    return null
  }
  const winnerSec = (() => {
    const first = results.find(r => Number(r.finish) === 1)
    const sFirst = timeToSec(first)
    if (sFirst != null) return sFirst
    let min: number | null = null
    for (const r of results) {
      const s = timeToSec(r)
      if (s == null) continue
      if (min == null || s < min) min = s
    }
    return min
  })()

  return (
    <div>
      <Hero
        title={<span>{comp.name}</span>}
        subtitle={
          <span>
            {`${formatDateISO(comp.date)}${comp.start_time ? ` ${comp.start_time}` : ''}${comp.location_city ? ` · ${comp.location_city}` : ''}${comp.location_country ? `, ${comp.location_country}` : ''}`}
            {comp.sport && <span className="pill" style={{marginLeft:8}}>🏅 {comp.sport}</span>}
            {typeof comp.distance_km === 'number' && <span className="pill" style={{marginLeft:6}}>📏 {comp.distance_km} km</span>}
          </span>
        }
        bgImageUrl={comp.image_url || undefined}
        right={<div className="panel" style={{display:'grid', gap:10, fontSize:14}}>
          <div><span className="muted">Winner</span><div style={{fontWeight:800, fontSize:18}}>{formatSeconds(win)}</div></div>
          <div><span className="muted">Average</span><div style={{fontWeight:800, fontSize:18}}>{formatSeconds(avg)}</div></div>
          <div><span className="muted">Participants</span><div style={{fontWeight:800, fontSize:18}}>{results.length}</div></div>
        </div>}
      />

      <div className="panel" style={{marginTop: 12}}>
        <div className="runner-meta" style={{fontSize:16}}>
          {comp.organizer && <span className="pill">🏟️ Organizer: {comp.organizer}</span>}
          {comp.homepage && <a className="pill link" href={comp.homepage} target="_blank" rel="noopener">🌐 Homepage</a>}
          <span className="pill">👥 Participants: {results.length}{typeof comp.enrolled_count === 'number' ? ` / ${comp.enrolled_count} enrolled` : ''}</span>
          {comp.sport && <span className="pill">🏅 Sport: {comp.sport}</span>}
          {typeof comp.distance_km === 'number' && <span className="pill">📏 {comp.distance_km} km</span>}
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

      {/* Podium removed per request; medals and behind time shown in table below */}

      <div className="panel" style={{padding:0, marginTop: 12}}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Runner</th>
              <th>Time</th>
              <th>Behind</th>
              <th>Pace</th>
            </tr>
          </thead>
          <tbody>
            {results.map((x, i) => (
              <tr key={x.id ?? i}>
                <td>
                  {Number(x.finish) === 1 ? '🥇 ' : Number(x.finish) === 2 ? '🥈 ' : Number(x.finish) === 3 ? '🥉 ' : ''}
                  {x.finish ?? ''}
                </td>
                <td>{x.runner_id ? <a href={`/runner/${x.runner_id}`}>{x.name ?? ''}</a> : (x.name ?? '')}</td>
                <td>{x.time ?? (x.time_sec ? formatSeconds(x.time_sec) : '')}</td>
                <td>{(() => {
                  const sec = timeToSec(x)
                  if (winnerSec == null || sec == null) return '—'
                  const diff = Math.max(0, sec - winnerSec)
                  return diff === 0 ? '—' : `+${formatSeconds(diff)}`
                })()}</td>
                <td>{typeof comp.distance_km === 'number' && x.time_sec ? formatPace(paceSecPerKm(x.time_sec, comp.distance_km)) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
