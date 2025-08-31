import { competitions } from '../data/competitions'
import { runners } from '../data/runners'
import { formatSeconds } from '../lib/badges'
import { Link } from 'react-router-dom'

export default function Competitions() {
  return (
    <div>
      <h2>Competitions</h2>
      <p className="muted">Browse events and quick leaderboards from the demo dataset.</p>
      <div className="grid" style={{marginTop: 10}}>
        {competitions.map(comp => {
          // collect all results for this competition
          const results = runners.flatMap(r => r.results.map(rr => ({ runner: r, res: rr }))).filter(x => x.res.competitionId === comp.id)
          const top = [...results].sort((a,b) => a.res.timeSec - b.res.timeSec).slice(0,5)
          return (
            <div key={comp.id} id={comp.id} className="panel">
              <div className="row" style={{justifyContent:'space-between'}}>
                <div>
                  <h3 style={{margin:0}}>{comp.name}</h3>
                  <div className="muted">{comp.date} · {comp.location} · {comp.distanceKm} km</div>
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
                      <td>{x.res.position}</td>
                      <td>{x.runner.name}</td>
                      <td>{formatSeconds(x.res.timeSec)}</td>
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
