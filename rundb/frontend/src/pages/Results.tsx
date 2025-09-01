import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Event } from '../lib/api'

export default function Results() {
  const [rows, setRows] = useState<any[]>([])
  const [events, setEvents] = useState<Record<string, Event>>({})
  const [eventFilter, setEventFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
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

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (eventFilter && r.event_id !== eventFilter) return false
      if (dateFrom && String(r.date) < dateFrom) return false
      return true
    })
  }, [rows, eventFilter, dateFrom])

  const eventList = useMemo(() => Object.values(events).sort((a,b) => a.name.localeCompare(b.name)), [events])

  return (
    <div>
      <h2>Results</h2>
      <p className="muted">Latest race results from all events.</p>
      <div className="row" style={{gap:12, alignItems:'center', marginBottom: 10}}>
        <label className="muted">Event</label>
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
          <option value="">All events</option>
          {eventList.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <label className="muted">From</label>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
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
                <td>{r.finish ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
