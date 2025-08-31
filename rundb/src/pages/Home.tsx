import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import Hero from '../components/Hero'
import RunnerCard from '../components/RunnerCard'
import { runners } from '../data/runners'
import { competitions } from '../data/competitions'
import CompetitionCard from '../components/CompetitionCard'

export default function Home() {
  const nav = useNavigate()
  return (
    <div className="grid" style={{gridTemplateColumns: '2fr 1fr'}}>
      <div>
        <Hero
          title={<span>Track your runs. Celebrate progress.</span>}
          subtitle={<span className="muted">Quickly look up runners, explore competitions, and see badges for both performance and consistency.</span>}
          right={<button className="btn" onClick={()=> nav('/leaderboards')}>Explore Leaderboards</button>}
        />

        <div className="kpi" style={{marginTop: 12}}>
          <div className="item"><div className="label">Runners</div><div className="value">{runners.length}</div></div>
          <div className="item"><div className="label">Competitions</div><div className="value">{competitions.length}</div></div>
          <div className="item"><div className="label">Total results</div><div className="value">{runners.reduce((a,r)=> a + r.results.length, 0)}</div></div>
        </div>
        <SearchBar
          data={runners}
          display={(r) => r.name}
          onSelect={(r) => nav(`/runner/${(r as any).id}`)}
          placeholder="Search runners by name"
        />

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
        <div className="grid" style={{marginTop: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))'}}>
          {[...competitions]
            .map(c => ({ c, participants: runners.filter(r => r.results.some(rr => rr.competitionId === c.id)).length }))
            .sort((a,b) => b.participants - a.participants)
            .slice(0, 3)
            .map(({c}) => (
              <CompetitionCard key={c.id} comp={c} />
            ))}
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
      </div>
    </div>
  )
}
