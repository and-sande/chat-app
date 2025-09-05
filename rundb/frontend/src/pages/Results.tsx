import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Event } from '../lib/api'
import { formatDateNODayMonth } from '../lib/format'

export default function Results() {
  const [rows, setRows] = useState<any[]>([])
  const [events, setEvents] = useState<Record<string, Event>>({})
  // Filters (match Athletes styling and feel)
  const [year, setYear] = useState<string>('')
  const [month, setMonth] = useState<string>('')
  const [type, setType] = useState<string>('')
  const [minParticipants, setMinParticipants] = useState<number>(0)
  const [distBucket, setDistBucket] = useState<string>('')
  const [showPremiumOnly, setShowPremiumOnly] = useState<boolean>(false)
  const [highlightMonth, setHighlightMonth] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth()+1).padStart(2,'0')
    return `${d.getFullYear()}-${mm}`
  })

  // Small helpers for highlight thumbnails
  function initialsFor(name?: string, count = 2) {
    if (!name) return '–'
    const parts = String(name).trim().split(/\s+/).filter(Boolean)
    const first = (parts[0] || '')[0] || ''
    const last = (parts.length > 1 ? parts[parts.length-1] : '')[0] || ''
    const init = (first + last).slice(0, count)
    return init.toUpperCase()
  }
  function bgForKey(key: string) {
    let h = 0
    for (let i=0;i<key.length;i++) h = (h * 31 + key.charCodeAt(i)) % 360
    const h2 = (h + 60) % 360
    return `linear-gradient(135deg, hsla(${h},70%,35%,0.6), hsla(${h2},70%,30%,0.45))`
  }
  useEffect(() => {
    let mounted = true
    api.results(100).then(r => { if (mounted) setRows(r) }).catch(()=>{})
    api.events().then(evs => {
      if (!mounted) return
      const map: Record<string, Event> = {}
      evs.forEach(e => { map[e.id] = e })
      setEvents(map)
    }).catch(()=>{})
    return () => { mounted = false }
  }, [])

  const years = useMemo(() => {
    const ys = new Set<string>()
    rows.forEach(r => { const y = String(r.date || '').slice(0,4); if (y) ys.add(y) })
    return Array.from(ys).sort((a,b)=> b.localeCompare(a))
  }, [rows])

  const types = useMemo(() => {
    const ts = new Set<string>()
    Object.values(events).forEach(e => { if (e.sport) ts.add(e.sport) })
    return Array.from(ts).sort()
  }, [events])

  function bucketForKm(km?: number | null): string {
    if (typeof km !== 'number') return ''
    if (km < 5) return '<5'
    if (km < 10) return '5-10'
    if (km < 21.1) return '10-21'
    if (km < 42.3) return '21-42'
    return '42+'
  }

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const e = events[r.event_id]
      if (year && !String(r.date || '').startsWith(year)) return false
      if (month) {
        const m = String(r.date || '').slice(5,7)
        if (m !== month) return false
      }
      if (type && (e?.sport || '') !== type) return false
      if (showPremiumOnly && !e?.premium) return false
      if (minParticipants && (r.participants_total || 0) < minParticipants) return false
      if (distBucket) {
        const b = bucketForKm(e?.distance_km)
        if (b !== distBucket) return false
      }
      return true
    })
  }, [rows, events, year, month, type, minParticipants, distBucket, showPremiumOnly])

  // Aggregate per event+date for participants and winner info
  const statsByEventDate = useMemo(() => {
    const map: Record<string, { participants?: number; winner?: string; winnerTime?: string }> = {}
    rows.forEach(r => {
      const key = `${r.event_id}|${String(r.date || '').slice(0,10)}`
      const cur = map[key] || {}
      const pt = typeof r.participants_total === 'number' ? r.participants_total : undefined
      if (typeof pt === 'number') cur.participants = Math.max(cur.participants ?? 0, pt)
      const finish = typeof r.finish === 'number' ? r.finish : Number(r.finish)
      if (finish === 1 && !cur.winner) {
        cur.winner = r.name
        cur.winnerTime = r.time
      }
      map[key] = cur
    })
    return map
  }, [rows])

  // Highlights: Top 3 for selected month (by participants) and Premium events
  const topForMonth = useMemo(() => {
    let y: number, m: number
    if (/^\d{4}-\d{2}$/.test(highlightMonth)) {
      y = parseInt(highlightMonth.slice(0,4), 10)
      m = parseInt(highlightMonth.slice(5,7), 10) - 1
    } else {
      const now = new Date()
      y = now.getFullYear()
      m = now.getMonth()
    }
    const groups: Record<string, { key: string; event_id: string; date: string; participants: number; winner?: string; winnerTime?: string; premium?: boolean; sport?: string | null; distance_km?: number | null; name?: string; image_url?: string | null }>
      = {}
    rows.forEach(r => {
      const d = new Date(r.date)
      if (Number.isNaN(d.getTime())) return
      if (d.getFullYear() !== y || d.getMonth() !== m) return
      const key = `${r.event_id}|${String(r.date || '').slice(0,10)}`
      const ev = events[r.event_id]
      const prev = groups[key]
      const participants = typeof r.participants_total === 'number' ? r.participants_total : 0
      const finish = typeof r.finish === 'number' ? r.finish : Number(r.finish)
      const winner = finish === 1 ? r.name : (prev?.winner)
      const winnerTime = finish === 1 ? r.time : (prev?.winnerTime)
      groups[key] = {
        key,
        event_id: r.event_id,
        date: String(r.date || '').slice(0,10),
        participants: Math.max(prev?.participants ?? 0, participants),
        winner,
        winnerTime,
        premium: ev?.premium,
        sport: ev?.sport ?? null,
        distance_km: ev?.distance_km ?? null,
        name: ev?.name ?? r.event_id,
        image_url: ev?.image_url ?? null,
      }
    })
    const all = Object.values(groups).sort((a,b)=> (b.participants||0) - (a.participants||0))
    const top3 = all.slice(0,3)
    const premium3 = all.filter(x => x.premium).slice(0,3)
    return { top3, premium3 }
  }, [rows, events, highlightMonth])

  return (
    <div>
      <h2>Results</h2>
      <p className="muted">Latest race results from all events.</p>
      <div className="panel" style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:16, alignItems:'end', padding:'12px 16px', borderRadius:12, background:'#0b1223', boxShadow:'0 0 0 1px rgba(51,65,85,.5) inset', width:'100%', marginBottom: 10}}>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Year</div>
          <select value={year} onChange={e => setYear(e.target.value)} style={{background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'8px'}}>
            <option value="">All</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Month</div>
          <select value={month} onChange={e => setMonth(e.target.value)} style={{background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'8px'}}>
            <option value="">All</option>
            {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Type</div>
          <select value={type} onChange={e => setType(e.target.value)} style={{background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'8px'}}>
            <option value="">All</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Participants</div>
          <select value={String(minParticipants)} onChange={e => setMinParticipants(Number(e.target.value))} style={{background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'8px'}}>
            <option value="0">Any</option>
            <option value="50">50+</option>
            <option value="100">100+</option>
            <option value="200">200+</option>
            <option value="500">500+</option>
          </select>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Distance</div>
          <select value={distBucket} onChange={e => setDistBucket(e.target.value)} style={{background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'8px'}}>
            <option value="">All</option>
            <option value="<5">&lt;5 km</option>
            <option value="5-10">5–10 km</option>
            <option value="10-21">10–21 km</option>
            <option value="21-42">21–42 km</option>
            <option value="42+">42+ km</option>
          </select>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Premium</div>
          <label style={{display:'flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={showPremiumOnly} onChange={e => setShowPremiumOnly(e.target.checked)} />
            <span className="muted">Show premium only</span>
          </label>
        </div>
      </div>
      {/* Highlights this month */}
      {(topForMonth.top3.length > 0 || topForMonth.premium3.length > 0) && (
        <div className="panel" style={{marginBottom:12}}>
          <div className="row" style={{justifyContent:'space-between'}}>
            <h3 style={{marginTop:0, marginBottom:0}}>Highlights</h3>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <span className="muted">Month</span>
              <input type="month" value={highlightMonth} onChange={e => setHighlightMonth(e.target.value)} className="input" style={{width:160}} />
            </div>
          </div>
          <div className="row" style={{justifyContent:'space-between', marginTop:8}}>
            {topForMonth.top3.length > 0 && (
              <div style={{flex:1, minWidth:260}}>
                <div className="muted" style={{marginBottom:6}}>Top by participants</div>
                {topForMonth.top3.map((x, i) => (
                  <div key={x.key} className="runner-card" style={{marginBottom:8, padding:'10px 12px'}}>
                    <div className="card-left">
                      {x.image_url ? (
                        <img src={x.image_url} alt="event" className="thumb" />
                      ) : (
                        <div className="thumb thumb-ph" style={{ background: bgForKey(x.event_id) }}>{initialsFor(x.name)}</div>
                      )}
                      <div className="card-text">
                        <div className="runner-title" style={{fontSize:16}}>{i+1}. {x.name}</div>
                        <div className="runner-meta">
                          <span className="pill">{x.participants} participants</span>
                          <span className="badge">{x.sport ?? '—'}</span>
                          {typeof x.distance_km === 'number' && <span className="pill">{x.distance_km} km</span>}
                          {x.winner && <span className="badge success">🏆 {x.winner}</span>}
                          {x.winnerTime && <span className="pill">{x.winnerTime}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="card-right"><Link className="btn ghost" to={`/competition/${x.event_id}`}>Open</Link></div>
                  </div>
                ))}
              </div>
            )}
            {topForMonth.premium3.length > 0 && (
              <div style={{flex:1, minWidth:260}}>
                <div className="muted" style={{marginBottom:6}}>Premium events</div>
                {topForMonth.premium3.map((x, i) => (
                  <div key={x.key} className="runner-card" style={{marginBottom:8, padding:'10px 12px'}}>
                    <div className="card-left">
                      {x.image_url ? (
                        <img src={x.image_url} alt="event" className="thumb" />
                      ) : (
                        <div className="thumb thumb-ph" style={{ background: bgForKey(x.event_id) }}>{initialsFor(x.name)}</div>
                      )}
                      <div className="card-text">
                        <div className="runner-title" style={{fontSize:16}}>{i+1}. {x.name}</div>
                        <div className="runner-meta">
                          <span className="badge premium">Premium</span>
                          <span className="badge">{x.sport ?? '—'}</span>
                          {typeof x.distance_km === 'number' && <span className="pill">{x.distance_km} km</span>}
                          {x.winner && <span className="badge success">🏆 {x.winner}</span>}
                          {x.winnerTime && <span className="pill">{x.winnerTime}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="card-right"><Link className="btn ghost" to={`/competition/${x.event_id}`}>Open</Link></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="panel" style={{padding:0}}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Event</th>
              <th>Type/Dist</th>
              <th>Participants</th>
              <th>Winner</th>
              <th>Winner Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                <td>{formatDateNODayMonth(r.date)}</td>
                <td>
                  <Link to={`/competition/${r.event_id}`}>{events[r.event_id]?.name ?? r.event_id}</Link>
                  {(events[r.event_id]?.location_city || events[r.event_id]?.location_country) && (
                    <span className="meta-pill" style={{marginLeft:8}}>
                      {events[r.event_id]?.location_city ?? ''}{events[r.event_id]?.location_city && events[r.event_id]?.location_country ? ', ' : ''}{events[r.event_id]?.location_country ?? ''}
                    </span>
                  )}
                </td>
                <td>
                  <span className="badge">{events[r.event_id]?.sport ?? '—'}</span>
                  {typeof events[r.event_id]?.distance_km === 'number' && <span className="pill" style={{marginLeft:6}}>{events[r.event_id]?.distance_km} km</span>}
                </td>
                <td>
                  <span className="pill">{statsByEventDate[`${r.event_id}|${String(r.date || '').slice(0,10)}`]?.participants ?? ''}</span>
                </td>
                <td>
                  {statsByEventDate[`${r.event_id}|${String(r.date || '').slice(0,10)}`]?.winner && (
                    <span className="badge success">🏆 {statsByEventDate[`${r.event_id}|${String(r.date || '').slice(0,10)}`]?.winner}</span>
                  )}
                </td>
                <td>
                  {statsByEventDate[`${r.event_id}|${String(r.date || '').slice(0,10)}`]?.winnerTime && (
                    <span className="pill">{statsByEventDate[`${r.event_id}|${String(r.date || '').slice(0,10)}`]?.winnerTime}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
