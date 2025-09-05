import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Event } from '../lib/api'
import { formatDateNODayMonth, formatDateDMSlash } from '../lib/format'

export default function Upcoming() {
  const [events, setEvents] = useState<Event[]>([])
  const [type, setType] = useState<string>('')
  const [distBucket, setDistBucket] = useState<string>('')
  const [premiumOnly, setPremiumOnly] = useState<boolean>(false)
  const [q, setQ] = useState<string>('')
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth()+1).padStart(2,'0')
    return `${d.getFullYear()}-${mm}`
  })
  useEffect(() => {
    let mounted = true
    api.events({ upcoming: true }).then(evs => { if (mounted) setEvents(evs) }).catch(()=>{})
    return () => { mounted = false }
  }, [])

  const types = useMemo(() => {
    const ts = new Set<string>()
    events.forEach(e => { if (e.sport) ts.add(e.sport) })
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

  // Helpers for placeholders
  function initialsFor(name?: string, count = 2) {
    if (!name) return '–'
    const parts = String(name).trim().split(/\s+/).filter(Boolean)
    const first = (parts[0] || '')[0] || ''
    const last = (parts.length > 1 ? parts[parts.length-1] : '')[0] || ''
    return (first + last).slice(0, count).toUpperCase()
  }
  function bgForKey(key: string) {
    let h = 0
    for (let i=0;i<key.length;i++) h = (h * 31 + key.charCodeAt(i)) % 360
    const h2 = (h + 60) % 360
    return `linear-gradient(135deg, hsla(${h},70%,35%,0.6), hsla(${h2},70%,30%,0.45))`
  }

  const filtered = useMemo(() => {
    return events
      .filter(e => {
        if (type && (e.sport || '') !== type) return false
        if (premiumOnly && !e.premium) return false
        if (distBucket) {
          const b = bucketForKm(e.distance_km)
          if (b !== distBucket) return false
        }
        if (q) {
          const hay = `${e.name} ${e.location_city ?? ''} ${e.location_country ?? ''}`.toLowerCase()
          if (!hay.includes(q.toLowerCase())) return false
        }
        if (month && /^\d{4}-\d{2}$/.test(month)) {
          const ym = `${String(e.date).slice(0,4)}-${String(e.date).slice(5,7)}`
          if (ym !== month) return false
        }
        return true
      })
      .sort((a,b) => String(a.date).localeCompare(String(b.date)))
  }, [events, type, premiumOnly, distBucket, q, month])
  return (
    <div>
      <h2>Upcoming events</h2>
      <p className="muted">Events with a future date or open signup.</p>

      {/* Filters */}
      <div className="panel" style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:16, alignItems:'end', padding:'12px 16px', borderRadius:12, background:'#0b1223', boxShadow:'0 0 0 1px rgba(51,65,85,.5) inset', width:'100%', marginBottom: 10}}>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Month</div>
          <input type="month" className="input" value={month} onChange={e => setMonth(e.target.value)} />
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Type</div>
          <select value={type} onChange={e => setType(e.target.value)} className="input">
            <option value="">All</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Distance</div>
          <select value={distBucket} onChange={e => setDistBucket(e.target.value)} className="input">
            <option value="">All</option>
            <option value="<5">&lt;5 km</option>
            <option value="5-10">5–10 km</option>
            <option value="10-21">10–21 km</option>
            <option value="21-42">21–42 km</option>
            <option value="42+">42+ km</option>
          </select>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Search</div>
          <input className="input" placeholder="Name or location" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Premium</div>
          <label style={{display:'flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={premiumOnly} onChange={e => setPremiumOnly(e.target.checked)} />
            <span className="muted">Show premium only</span>
          </label>
        </div>
      </div>

      {/* Event cards */}
      <div className="grid" style={{marginTop: 10}}>
        {filtered.map(ev => (
          <div key={ev.id} className="event-card">
            {ev.image_url ? (
              <img src={ev.image_url} alt="event" className="event-thumb-large" />
            ) : (
              <div className="event-thumb-large ph" style={{ background: bgForKey(ev.id) }}>{initialsFor(ev.name)}</div>
            )}
            <div className="event-card-body">
              <div className="row" style={{justifyContent:'space-between', alignItems:'flex-start'}}>
                <div style={{minWidth:0}}>
                  <h3 style={{margin:'0 0 6px 0', fontSize:20}}><Link to={`/competition/${ev.id}`}>{ev.name}</Link></h3>
                  <div className="runner-meta" style={{fontSize:14}}>
                    <span className="pill">{formatDateDMSlash(ev.date)}{ev.start_time ? ` ${ev.start_time}` : ''}</span>
                    {ev.location_city || ev.location_country ? (
                      <span className="meta-pill">{ev.location_city ?? ''}{ev.location_city && ev.location_country ? ', ' : ''}{ev.location_country ?? ''}</span>
                    ) : null}
                    <span className="badge">{ev.sport ?? '—'}</span>
                    {typeof ev.distance_km === 'number' && <span className="pill">{ev.distance_km} km</span>}
                    {ev.premium && <span className="badge premium">Premium</span>}
                    {ev.organizer && <span className="pill">👤 {ev.organizer}</span>}
                    {typeof ev.enrolled_count === 'number' && <span className="pill">📝 {ev.enrolled_count} enrolled</span>}
                  </div>
                </div>
                <div className="card-right" style={{gap:6}}>
                  {ev.homepage && <a className="btn" href={ev.homepage} target="_blank" rel="noreferrer">Homepage</a>}
                  <Link className="btn ghost" to={`/competition/${ev.id}`}>Details</Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
