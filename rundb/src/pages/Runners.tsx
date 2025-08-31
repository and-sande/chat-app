import RunnerCard from '../components/RunnerCard'
import { runners } from '../data/runners'

export default function Runners() {
  return (
    <div>
      <h2>Runners</h2>
      <p className="muted">Browse all known runners in this demo dataset.</p>
      <div className="grid" style={{marginTop: 10}}>
        {runners.map(r => <RunnerCard key={r.id} runner={r} />)}
      </div>
    </div>
  )
}

