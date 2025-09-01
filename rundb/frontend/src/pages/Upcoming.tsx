import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Event } from '../lib/api'
import { formatDateISO } from '../lib/format'

export default function Upcoming() {
  const [events, setEvents] = useState<Event[]>([])
  useEffect(() => {
    let mounted = true
    api.events({ upcoming: true }).then(evs => { if (mounted) setEvents(evs) }).catch(()=>{})
    return () => { mounted = false }
  }, [])
  return (
    <div>
      <h2>Upcoming events</h2>
      <p className="muted">Events with a future date or open signup.</p>
      <div className="grid" style={{marginTop: 10}}>
        {events.map(ev => (
          <div key={ev.id} className="panel">
            <div className="row" style={{justifyContent:'space-between'}}>
              <div>
                <h3 style={{margin:0}}>{ev.name}</h3>
                <div className="muted">
                  {formatDateISO(ev.date)}{ev.start_time ? ` ${ev.start_time}` : ''}
                  {ev.location_city ? ` · ${ev.location_city}` : ''}
                  {ev.location_country ? `, ${ev.location_country}` : ''}
                  {typeof ev.distance_km === 'number' ? ` · ${ev.distance_km} km` : ''}
                </div>
              </div>
              <Link className="btn" to={`/competition/${ev.id}`}>View details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

