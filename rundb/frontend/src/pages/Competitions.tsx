import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Event } from '../lib/api'
import { formatDateISO, formatSeconds } from '../lib/format'

type TopRow = { finish?: number | null; name?: string | null; time?: string | null }

export default function Competitions() {
  const [events, setEvents] = useState<Event[]>([])
  const [tops, setTops] = useState<Record<string, TopRow[]>>({})
  useEffect(() => {
    let mounted = true
    api.events().then(evs => {
      if (!mounted) return
      setEvents(evs)
      // fetch top results per event (first 5)
      evs.forEach(ev => {
        api.eventResults(ev.id).then(rows => {
          if (!mounted) return
          setTops(prev => ({ ...prev, [ev.id]: rows.slice(0,5) }))
        }).catch(()=>{})
      })
    }).catch(()=>{})
    return () => { mounted = false }
  }, [])
  return (
    <div>
      <h2>Competitions</h2>
      <p className="muted">Browse events and quick leaderboards from the API.</p>
      <div className="grid" style={{marginTop: 10}}>
        {events.map(comp => {
          const top = tops[comp.id] ?? []
          return (
            <div key={comp.id} id={comp.id} className="panel">
              <div className="row" style={{justifyContent:'space-between'}}>
                <div>
                  <h3 style={{margin:0}}>{comp.name}</h3>
                  <div className="muted">
                    {formatDateISO(comp.date)}{comp.start_time ? ` ${comp.start_time}` : ''}
                    {comp.location_city ? ` · ${comp.location_city}` : ''}
                    {comp.location_country ? `, ${comp.location_country}` : ''}
                    {typeof comp.distance_km === 'number' ? ` · ${comp.distance_km} km` : ''}
                  </div>
                </div>
                <Link className="btn" to={`/competition/${comp.id}`}>View details</Link>
              </div>
              <table className="table" style={{marginTop: 10}}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Runner</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((x, i) => (
                    <tr key={i}>
                      <td>{x.finish ?? ''}</td>
                      <td>{x.name ?? ''}</td>
                      <td>{x.time ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}
