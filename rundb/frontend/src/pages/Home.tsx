import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Hero from '../components/Hero'
import RunnerCard from '../components/RunnerCard'
import { runners } from '../data/runners'
import { api, type Event, type Stats } from '../lib/api'

export default function Home() {
  const nav = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [upcoming, setUpcoming] = useState<Event[]>([])
  useEffect(() => {
    let mounted = true
    api.stats().then(s => { if (mounted) setStats(s) }).catch(()=>{})
    api.events({ upcoming: true }).then(ev => { if (mounted) setUpcoming(ev) }).catch(()=>{})
    return () => { mounted = false }
  }, [])
  return (
    <div className="grid" style={{gridTemplateColumns: '2fr 1fr'}}>
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
          {runners.slice(0, 4).map(r => (
            <RunnerCard key={r.id} runner={r} />
          ))}
        </div>

        <div className="row" style={{justifyContent:'space-between', marginTop: 24}}>
          <h3 style={{margin:0}}>Popular runs</h3>
          <button className="btn ghost" onClick={()=> nav('/competitions')}>Browse all</button>
        </div>
        <div className="panel" style={{marginTop:8}}>
          <div className="muted">Connected to API. Explore competitions for details.</div>
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
          <div className="row" style={{justifyContent:'space-between'}}>
            <h3 style={{margin:0}}>Upcoming events</h3>
          </div>
          <ul style={{marginTop:8}}>
            {upcoming.map(c => (
              <li key={c.id} className="row" style={{justifyContent:'space-between'}}>
                <span>{c.premium ? '⭐ ' : ''}{c.name}</span>
                <span className="muted">{new Date(c.date).toLocaleDateString()} · {c.enrolled_count ?? 0} enrolled</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
