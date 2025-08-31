import { Link } from 'react-router-dom'
import { competitions } from '../data/competitions'
import type { Competition } from '../data/types'
import { runners } from '../data/runners'
import { formatDateISO } from '../lib/format'

function participantsFor(comp: Competition) {
  return runners.filter(r => r.results.some(rr => rr.competitionId === comp.id)).length
}

export default function CompetitionCard({ comp }: { comp: Competition }) {
  const participants = participantsFor(comp)
  return (
    <div className="run-card">
      <div className="run-media" style={{backgroundImage: `url(${comp.imageUrl})`}} />
      <div className="run-content">
        <div className="run-title-row">
          <h4 className="run-title">{comp.name}</h4>
          <Link to={`/competition/${comp.id}`} className="btn ghost" style={{padding:'6px 10px'}}>View</Link>
        </div>
        <div className="runner-meta" style={{marginTop:6}}>
          <span>{formatDateISO(comp.date)}</span>
          <span>· {comp.location}</span>
          <span>· {comp.distanceKm} km</span>
        </div>
        <div className="runner-meta" style={{marginTop:8}}>
          <span className="pill">🏃 {participants} runners</span>
          {comp.organizer && <span className="pill">🏟️ {comp.organizer}</span>}
          {comp.homepage && <a className="pill link" href={comp.homepage} target="_blank" rel="noopener">🌐 Homepage</a>}
        </div>
      </div>
    </div>
  )
}

