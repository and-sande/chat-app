import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Event } from '../lib/api'

export default function Results() {
  const [rows, setRows] = useState<any[]>([])
  const [events, setEvents] = useState<Record<string, Event>>({})
  // Filters (match Athletes styling and feel)
  const [year, setYear] = useState<string>('')
  const [month, setMonth] = useState<string>('')
  const [type, setType] = useState<string>('')
  const [minParticipants, setMinParticipants] = useState<number>(0)
  const [distBucket, setDistBucket] = useState<string>('')
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
      if (minParticipants && (r.participants_total || 0) < minParticipants) return false
      if (distBucket) {
        const b = bucketForKm(e?.distance_km)
        if (b !== distBucket) return false
      }
      return true
    })
  }, [rows, events, year, month, type, minParticipants, distBucket])

  return (
    <div>
      <h2>Results</h2>
      <p className="muted">Latest race results from all events.</p>
      <div className="panel" style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:16, alignItems:'end', padding:'12px 16px', borderRadius:12, background:'#0b1223', boxShadow:'0 0 0 1px rgba(51,65,85,.5) inset', width:'100%', marginBottom: 10}}>
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
      </div>
      <div className="panel" style={{padding:0}}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Event</th>
              <th>Name</th>
              <th>Time</th>
              <th>Pos</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                <td>{r.date}</td>
                <td><Link to={`/competition/${r.event_id}`}>{events[r.event_id]?.name ?? r.event_id}</Link></td>
                <td>{r.name}</td>
                <td>{r.time}</td>
                <td>{r.finish ?? ''}{typeof r.participants_total === 'number' ? ` / ${r.participants_total}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
