import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Hero from '../components/Hero'
import RunnerCard from '../components/RunnerCard'
import { api, type Event, type Stats, type Athlete } from '../lib/api'
import { formatDateNODayMonth, formatDateDMSlash } from '../lib/format'

export default function Home() {
  const nav = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [upcoming, setUpcoming] = useState<Event[]>([])
  const [popular, setPopular] = useState<Athlete[]>([])
  const [latest, setLatest] = useState<any[]>([])
  const [eventsById, setEventsById] = useState<Record<string, Event>>({})
  useEffect(() => {
    let mounted = true
    api.stats().then(s => { if (mounted) setStats(s) }).catch(()=>{})
    api.events({ upcoming: true }).then(ev => { if (mounted) setUpcoming(ev) }).catch(()=>{})
    api.athletes({ top: 'popular3' as any, popularity_min: 1 }).then(a => { if (mounted) setPopular(a.slice(0,3)) }).catch(()=>{})
    api.results(50).then(r => { if (mounted) setLatest(r) }).catch(()=>{})
    api.events().then(all => { if (!mounted) return; const map: Record<string, Event> = {}; all.forEach(e => map[e.id] = e); setEventsById(map) }).catch(()=>{})
    return () => { mounted = false }
  }, [])

  // group latest results by event+date to get winner + participants
  const latestSummaries = useMemo(() => {
    const groups: Record<string, { key: string; event_id: string; date: string; participants: number; winner?: string; time?: string }> = {}
    latest.forEach(r => {
      const key = `${r.event_id}|${String(r.date || '').slice(0,10)}`
      const prev = groups[key]
      const participants = typeof r.participants_total === 'number' ? r.participants_total : 0
      const isWinner = Number(r.finish) === 1
      groups[key] = {
        key,
        event_id: r.event_id,
        date: String(r.date || '').slice(0,10),
        participants: Math.max(prev?.participants ?? 0, participants),
        winner: isWinner ? (r.name ?? prev?.winner) : prev?.winner,
        time: isWinner ? (r.time ?? prev?.time) : prev?.time,
      }
    })
    return Object.values(groups).sort((a,b)=> b.date.localeCompare(a.date)).slice(0,6)
  }, [latest])
  return (
    <div className="grid" style={{gridTemplateColumns: 'minmax(0,1fr) 360px'}}>
      <div>
        <Hero
          title={<span>Track your runs. Celebrate progress.</span>}
          subtitle={<span className="muted">Quickly look up runners, explore competitions, and see badges for both performance and consistency.</span>}
          right={<button className="btn" onClick={()=> nav('/leaderboards')}>Explore Leaderboards</button>}
        />

        <div className="kpi" style={{marginTop: 12}}>
          <div className="item"><div className="label">Runners</div><div className="value">{stats ? stats.runners_count : '—'}</div></div>
          <div className="item"><div className="label">Events</div><div className="value">{stats ? stats.events_count : '—'}</div></div>
          <div className="item"><div className="label">Total results</div><div className="value">{stats ? stats.results_count : '—'}</div></div>
        </div>
        {/* Search moved to top navbar */}

        <div className="row" style={{justifyContent:'space-between', marginTop: 16}}>
          <h3 style={{margin:0}}>Trending runners</h3>
          <button className="btn" onClick={()=> nav('/leaderboards')}>View leaderboards</button>
        </div>
        <div className="grid" style={{marginTop: 8}}>
          {popular.map(a => (
            <RunnerCard key={a.id} runner={{
              id: a.id,
              name: a.name,
              club: a.club ?? undefined,
              country: a.country ?? undefined,
              avatarUrl: a.avatar_url ?? undefined,
              age: undefined,
              results: [],
            } as any} />
          ))}
        </div>

        <div className="row" style={{justifyContent:'space-between', marginTop: 24}}>
          <h3 style={{margin:0}}>Upcoming highlights</h3>
          <button className="btn ghost" onClick={()=> nav('/upcoming')}>View all</button>
        </div>
        <div className="panel" style={{marginTop:8}}>
          <ul style={{listStyle:'none', padding:0, margin:0}}>
            {upcoming.slice(0,3).map(ev => (
              <li key={ev.id} className="row" style={{justifyContent:'space-between', padding:'6px 0'}}>
                <div style={{flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                  <a className="pill link" href={`/competition/${ev.id}`}>{ev.name}</a>
                  {ev.premium && <span className="badge premium" style={{marginLeft:8}}>Premium</span>}
                </div>
                <div className="muted" style={{whiteSpace:'nowrap'}}>
                  {formatDateDMSlash(ev.date)}{ev.start_time ? ` ${ev.start_time}` : ''}
                  {typeof ev.distance_km === 'number' ? ` · ${ev.distance_km} km` : ''}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="row" style={{justifyContent:'space-between', marginTop: 24}}>
          <h3 style={{margin:0}}>Latest results</h3>
          <button className="btn ghost" onClick={()=> nav('/results')}>Browse all</button>
        </div>
        <div className="panel" style={{padding:0, marginTop:8}}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event</th>
                <th>Winner</th>
                <th>Time</th>
                <th>Participants</th>
              </tr>
            </thead>
            <tbody>
              {latestSummaries.map(s => (
                <tr key={s.key}>
                  <td>{formatDateNODayMonth(s.date)}</td>
                  <td>{eventsById[s.event_id]?.name ?? s.event_id}</td>
                  <td>{s.winner ?? '—'}</td>
                  <td>{s.time ?? '—'}</td>
                  <td>{s.participants || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <div className="panel">
          <h3>What is RunDB?</h3>
          <p className="muted">RunDB is a simple, social results tracker. Look up athletes, browse competitions, and celebrate achievements with badges.</p>
          <ul>
            <li>Search athletes and view full race history</li>
            <li>See computed badges for activity and performance</li>
            <li>Browse competitions and top placements</li>
          </ul>
        </div>

        <div className="panel" style={{marginTop:12}}>
          <h3 style={{margin:0}}>Upcoming events</h3>
          <ul style={{marginTop:10, listStyle:'none', padding:0}}>
            {upcoming.map(c => (
              <li key={c.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'6px 0'}}>
                <div style={{flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                  <a href={`/competition/${c.id}`} style={{color:'inherit', textDecoration:'none'}}>
                    {c.premium ? '⭐ ' : ''}{c.name}
                  </a>
                </div>
                <div className="muted" style={{whiteSpace:'nowrap'}}>
                  {formatDateDMSlash(c.date)} · {c.enrolled_count ?? 0} enrolled
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
