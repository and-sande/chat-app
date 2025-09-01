import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatPace, formatSeconds, formatDateNOShort } from '../lib/format'
import Sparkline from '../components/Sparkline'
import Avatar from '../components/Avatar'
import Hero from '../components/Hero'
import { api, type Runner as APIRunner, type Event as APIEvent, type Athlete } from '../lib/api'

export default function RunnerProfile() {
  const { id } = useParams()
  const [runner, setRunner] = useState<APIRunner | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [eventsById, setEventsById] = useState<Record<string, APIEvent>>({})
  const [year, setYear] = useState<string>('')
  const [distBucket, setDistBucket] = useState<string>('')
  const [popStar, setPopStar] = useState<number | null>(null)
  const [hiRow, setHiRow] = useState<number | null>(null)
  const [visits, setVisits] = useState<number | null>(null)
  useEffect(() => {
    if (!id) return
    api.runner(id).then(r => { setRunner(r); setVisits((r as any)?.visits_count ?? null) }).catch(()=> setRunner(null))
    api.runnerResults(id).then(setResults).catch(()=>{})
    api.events().then(evs => {
      const map: Record<string, APIEvent> = {}
      evs.forEach(e => { map[e.id] = e })
      setEventsById(map)
    }).catch(()=>{})
    api.athletes().then((as: Athlete[]) => {
      const me = as.find(a => a.id === id)
      if (me && typeof me.popularity_star === 'number') setPopStar(me.popularity_star)
    }).catch(()=>{})
    // count visit
    api.runnerVisit(id).then((res:any)=> setVisits(res?.visits_count ?? null)).catch(()=>{})
  }, [id])
  const sorted = useMemo(() => [...results].sort((a,b) => String(b.date).localeCompare(String(a.date))), [results])

  // Quick filters: year and distance bucket
  const years = useMemo(() => {
    const ys = new Set<string>()
    results.forEach(r => { const y = String(r.date || '').slice(0,4); if (y && y !== 'unde') ys.add(y) })
    return Array.from(ys).sort((a,b)=>b.localeCompare(a))
  }, [results])
  function bucketForKm(km?: number | null): string {
    if (typeof km !== 'number') return ''
    if (km < 5) return '<5'
    if (km < 10) return '5-10'
    if (km < 21.1) return '10-21'
    if (km < 42.3) return '21-42'
    return '42+'
  }
  const filtered = useMemo(() => {
    return sorted.filter(r => {
      if (year && !String(r.date || '').startsWith(year)) return false
      const km = eventsById[r.event_id]?.distance_km
      if (distBucket) return bucketForKm(km) === distBucket
      return true
    })
  }, [sorted, year, distBucket, eventsById])
  const paceSecPerKm = (timeSec: number, km?: number | null) => {
    if (!km || !isFinite(km)) return timeSec
    return Math.round(timeSec / km)
  }

  const totalRaces = filtered.length
  const firstRace = filtered[filtered.length-1]?.date
  const lastRace = filtered[0]?.date
  const bestFinish = useMemo(() => {
    const finishes = filtered.map(r => r.finish).filter((v: any) => typeof v === 'number') as number[]
    if (!finishes.length) return undefined
    return Math.min(...finishes)
  }, [filtered])
  const p1 = filtered.filter(r => r.finish === 1).length
  const p2 = filtered.filter(r => r.finish === 2).length
  const p3 = filtered.filter(r => r.finish === 3).length

  // Trend values: map better positions higher by inverting against max
  const trendValues = useMemo(() => {
    const finishes = filtered.map(r => (typeof r.finish === 'number' ? r.finish : null)).filter((v: number|null) => v !== null) as number[]
    if (!finishes.length) return []
    const max = Math.max(...finishes)
    return filtered.map(r => {
      const f = typeof r.finish === 'number' ? r.finish : null
      return f === null ? 0 : (max + 1 - f)
    })
  }, [filtered])
  if (!runner) {
    return <div className="panel">Loading athlete…</div>
  }
  return (
    <div>
      <Hero
        title={<span className="row" style={{gap:12, alignItems:'center'}}>
          <Avatar name={runner.name} src={runner.avatar_url ?? undefined} size={88} />
          <span style={{display:'flex', flexDirection:'column'}}>
            <span>{runner.name}</span>
            <span className="runner-meta" style={{marginTop:6}}>
              {popStar ? <span className="pill">{'★'.repeat(Math.max(1, popStar))}</span> : null}
              <span className="pill">🥇 {p1}</span>
              <span className="pill">🥈 {p2}</span>
              <span className="pill">🥉 {p3}</span>
            </span>
          </span>
        </span>}
        subtitle={<span>{runner.club ?? 'Independent'} · {runner.country ?? '—'}{runner.sex ? ` · ${runner.sex}` : ''}{runner.date ? ` · b. ${runner.date}` : ''}</span>}
        right={<span className="pill" title="Profile visits">👀 {visits ?? '—'}</span>}
      />

      <div className="kpi" style={{marginTop: 12}}>
        <div className="item"><div className="label">Total races</div><div className="value">{totalRaces}</div></div>
        <div className="item"><div className="label">Best finish</div><div className="value">{bestFinish ?? '—'}</div></div>
        <div className="item"><div className="label">First race</div><div className="value">{firstRace ? formatDateNOShort(firstRace) : '—'}</div></div>
        <div className="item"><div className="label">Last race</div><div className="value">{lastRace ? formatDateNOShort(lastRace) : '—'}</div></div>
      </div>

      {/* medals summary shown in header with name; duplicate row removed per request */}

      {/* Quick filters */}
      <div className="panel" style={{marginTop:12, background:'#0b1223', boxShadow:'0 0 0 1px rgba(51,65,85,.5) inset'}}>
        <div className="row" style={{gap:12}}>
          <div>
            <span className="muted">Year</span>
            <select value={year} onChange={e=>setYear(e.target.value)} style={{marginLeft:8, background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'6px 8px'}}>
              <option value="">All</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <span className="muted">Distance</span>
            <select value={distBucket} onChange={e=>setDistBucket(e.target.value)} style={{marginLeft:8, background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'6px 8px'}}>
              <option value="">All</option>
              <option value="<5">&lt;5 km</option>
              <option value="5-10">5–10 km</option>
              <option value="10-21">10–21 km</option>
              <option value="21-42">21–42 km</option>
              <option value="42+">42+ km</option>
            </select>
          </div>
        </div>
      </div>

      {trendValues.length > 1 && (
        <div style={{marginTop: 12}}>
          <h3 style={{margin:'12px 0'}}>Trend</h3>
          <div className="panel" style={{padding: 8}}>
            <Sparkline
              values={trendValues}
              width={520}
              height={90}
              labels={filtered.map(r => `${formatDateNOShort(r.date)} • ${(eventsById[r.event_id]?.name ?? r.event_id)} • pos ${r.finish ?? '—'}`)}
              onPointClick={(i) => {
                setHiRow(i)
                const el = document.getElementById(`race-${i}`)
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
                // Clear highlight after a short delay
                window.setTimeout(() => setHiRow(prev => (prev === i ? null : prev)), 1800)
              }}
            />
            <div className="muted" style={{fontSize:12}}>Higher line = better position (inverted)</div>
          </div>
        </div>
      )}

      <h3 style={{marginTop: 18}}>Race history</h3>
      <div className="panel" style={{padding:0}}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Competition</th>
              <th>Distance</th>
              <th>Time</th>
              <th>After</th>
              <th>Pace</th>
              <th>Pos</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((res, i) => {
              const comp = eventsById[res.event_id]
              const km = comp?.distance_km
              return (
                <tr key={i} id={`race-${i}`} style={hiRow===i ? { background: 'rgba(107,220,255,0.12)' } : undefined}>
                  <td>{formatDateNOShort(res.date)}</td>
                  <td><Link to={`/competition/${res.event_id}`}>{comp?.name ?? res.event_id}</Link></td>
                  <td>{typeof km === 'number' ? `${km} km` : '—'}</td>
                  <td>{res.time ?? (res.time_sec ? formatSeconds(res.time_sec) : '—')}</td>
                  <td>{res.behind ?? '—'}</td>
                  <td>{typeof km === 'number' && res.time_sec ? formatPace(paceSecPerKm(res.time_sec, km)) : '—'}</td>
                  <td>{res.finish === 1 ? '🥇 1' : res.finish === 2 ? '🥈 2' : res.finish === 3 ? '🥉 3' : (res.finish ?? '')}{res.participants_total ? ` / ${res.participants_total}` : ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
