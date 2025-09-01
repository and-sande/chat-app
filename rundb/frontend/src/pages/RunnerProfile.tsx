import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatPace, formatSeconds } from '../lib/format'
import Avatar from '../components/Avatar'
import Hero from '../components/Hero'
import { api, type Runner as APIRunner, type Event as APIEvent } from '../lib/api'

export default function RunnerProfile() {
  const { id } = useParams()
  const [runner, setRunner] = useState<APIRunner | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [eventsById, setEventsById] = useState<Record<string, APIEvent>>({})
  useEffect(() => {
    if (!id) return
    api.runner(id).then(setRunner).catch(()=> setRunner(null))
    api.runnerResults(id).then(setResults).catch(()=>{})
    api.events().then(evs => {
      const map: Record<string, APIEvent> = {}
      evs.forEach(e => { map[e.id] = e })
      setEventsById(map)
    }).catch(()=>{})
  }, [id])
  const sorted = useMemo(() => [...results].sort((a,b) => String(b.date).localeCompare(String(a.date))), [results])
  const paceSecPerKm = (timeSec: number, km?: number | null) => {
    if (!km || !isFinite(km)) return timeSec
    return Math.round(timeSec / km)
  }

  const totalRaces = sorted.length
  const firstRace = sorted[sorted.length-1]?.date
  const lastRace = sorted[0]?.date
  const bestFinish = useMemo(() => {
    const finishes = sorted.map(r => r.finish).filter((v: any) => typeof v === 'number') as number[]
    if (!finishes.length) return undefined
    return Math.min(...finishes)
  }, [sorted])
  if (!runner) {
    return <div className="panel">Loading athlete…</div>
  }
  return (
    <div>
      <Hero
        title={<span className="row" style={{gap:12}}><Avatar name={runner.name} src={runner.avatar_url ?? undefined} size={88} /> {runner.name}</span>}
        subtitle={<span>{runner.club ?? 'Independent'} · {runner.country ?? '—'}{runner.sex ? ` · ${runner.sex}` : ''}{runner.date ? ` · b. ${runner.date}` : ''}</span>}
      />

      <div className="kpi" style={{marginTop: 12}}>
        <div className="item"><div className="label">Total races</div><div className="value">{totalRaces}</div></div>
        <div className="item"><div className="label">Best finish</div><div className="value">{bestFinish ?? '—'}</div></div>
        <div className="item"><div className="label">First race</div><div className="value">{firstRace ?? '—'}</div></div>
        <div className="item"><div className="label">Last race</div><div className="value">{lastRace ?? '—'}</div></div>
      </div>

      <h3 style={{marginTop: 18}}>Race history</h3>
      <div className="panel" style={{padding:0}}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Competition</th>
              <th>Distance</th>
              <th>Time</th>
              <th>Pace</th>
              <th>Pos</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((res, i) => {
              const comp = eventsById[res.event_id]
              const km = comp?.distance_km
              return (
                <tr key={i}>
                  <td>{res.date}</td>
                  <td><Link to={`/competition/${res.event_id}`}>{comp?.name ?? res.event_id}</Link></td>
                  <td>{typeof km === 'number' ? `${km} km` : '—'}</td>
                  <td>{res.time ?? (res.time_sec ? formatSeconds(res.time_sec) : '—')}</td>
                  <td>{typeof km === 'number' && res.time_sec ? formatPace(paceSecPerKm(res.time_sec, km)) : '—'}</td>
                  <td>{res.finish ?? ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
