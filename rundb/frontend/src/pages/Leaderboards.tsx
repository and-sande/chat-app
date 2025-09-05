import { useEffect, useMemo, useState } from 'react'
import { api, type Athlete } from '../lib/api'

type Metric = 'most-active' | 'most-popular' | 'most-viewed'

export default function Leaderboards() {
  const [metric, setMetric] = useState<Metric>('most-active')
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [sex, setSex] = useState<string>('')
  const [country, setCountry] = useState<string>('')
  const [minRuns, setMinRuns] = useState<number>(0)

  useEffect(() => {
    let mounted = true
    const load = () => api.athletes({ sex: sex as any, min_runs: minRuns, top: undefined })
      .then(a => { if (mounted) setAthletes(a) })
      .catch(()=>{})
    load()
    return () => { mounted = false }
  }, [sex, minRuns])

  const countries = useMemo(() => {
    const set = new Set<string>()
    athletes.forEach(a => { if (a.country) set.add(a.country) })
    return Array.from(set).sort()
  }, [athletes])

  const data = useMemo(() => {
    let rows = athletes.filter(a => (country ? a.country === country : true))
    if (metric === 'most-active') {
      return rows
        .map(a => ({ athlete: a, value: a.run_count || 0, aux: `Runs: ${a.run_count ?? 0}` }))
        .sort((a,b) => (b.value - a.value))
    }
    if (metric === 'most-popular') {
      return rows
        .map(a => ({ athlete: a, value: a.popularity || 0, aux: `${'★'.repeat(Math.max(1, a.popularity_star || 1))}` }))
        .sort((a,b) => (b.value - a.value))
    }
    // most-viewed
    return rows
      .map(a => ({ athlete: a, value: a.visits_count || 0, aux: a.last_visit ? `Last viewed: ${new Date(a.last_visit).toLocaleDateString()}` : '' }))
      .sort((a,b) => (b.value - a.value))
  }, [athletes, metric, country])

  return (
    <div>
      <h2>Leaderboards</h2>
      <p className="muted">Explore standout athletes by activity, popularity, and views.</p>

      <div className="controls panel" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
        <div className="row" style={{gap:8}}>
          <button className={`chip ${metric==='most-active'?'selected':''}`} onClick={() => setMetric('most-active')}>Most Active</button>
          <button className={`chip ${metric==='most-popular'?'selected':''}`} onClick={() => setMetric('most-popular')}>Most Popular</button>
          <button className={`chip ${metric==='most-viewed'?'selected':''}`} onClick={() => setMetric('most-viewed')}>Most Viewed</button>
        </div>
        <div className="row" style={{gap:8}}>
          <label className="muted">Sex</label>
          <select className="input" style={{width: 120}} value={sex} onChange={(e)=> setSex(e.target.value)}>
            <option value="">All</option>
            <option value="F">Female</option>
            <option value="M">Male</option>
          </select>
        </div>
        <div className="row" style={{gap:8}}>
          <label className="muted">Min runs</label>
          <select className="input" style={{width: 120}} value={String(minRuns)} onChange={(e)=> setMinRuns(Number(e.target.value))}>
            <option value="0">Any</option>
            <option value="10">10+</option>
            <option value="25">25+</option>
            <option value="50">50+</option>
          </select>
        </div>
        <div className="row" style={{gap:8}}>
          <label className="muted">Country</label>
          <select className="input" style={{width: 120}} value={country} onChange={(e)=> setCountry(e.target.value)}>
            <option value="">All</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="panel" style={{padding:0, marginTop: 12}}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Runner</th>
              <th>Club</th>
              <th>Country</th>
              <th style={{textAlign:'right'}}>{metric === 'most-active' ? 'Runs' : metric === 'most-popular' ? 'Popularity' : 'Views'}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.athlete.id}>
                <td>{i+1}</td>
                <td>{row.athlete.name}</td>
                <td className="muted">{row.athlete.club ?? 'Independent'}</td>
                <td className="muted">{row.athlete.country ?? '—'}</td>
                <td style={{textAlign:'right'}}>
                  {metric === 'most-active' ? row.value : metric === 'most-popular' ? `${row.value} (${row.aux})` : `${row.value}${row.aux ? ` · ${row.aux}` : ''}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
