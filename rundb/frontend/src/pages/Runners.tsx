import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { api, type Athlete } from '../lib/api'

export default function Runners() {
  const navigate = useNavigate()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [q, setQ] = useState('')
  const [sex, setSex] = useState('')
  const [minRuns, setMinRuns] = useState<number>(0)
  const [dateFrom, setDateFrom] = useState('')
  const [minP1, setMinP1] = useState<number>(0)
  const [minP2, setMinP2] = useState<number>(0)
  const [minP3, setMinP3] = useState<number>(0)
  const [minTop3, setMinTop3] = useState<number>(0)
  const [podiumOpen, setPodiumOpen] = useState<boolean>(false)
  const [popMin, setPopMin] = useState<number>(1)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true
    const load = () => api.athletes({ q, sex: sex as any, min_runs: minRuns, date_from: dateFrom, min_p1: minP1, min_p2: minP2, min_p3: minP3, min_top3: minTop3, popularity_min: popMin })
      .then(a => { if (mounted) setAthletes(a) })
      .catch(()=>{})

    // Debounce search text lightly
    const t = setTimeout(load, q ? 180 : 0)
    return () => { mounted = false; clearTimeout(t) }
  }, [q, sex, minRuns, dateFrom, minP1, minP2, minP3, minTop3, popMin])

  useEffect(() => {
    // Autofocus search when opening page
    searchRef.current?.focus()
  }, [])

  const top3 = useMemo(() => {
    return [...athletes].sort((a,b) => (b.popularity || 0) - (a.popularity || 0)).slice(0,3)
  }, [athletes])

  return (
    <div>
      <h2>Athletes</h2>
      <div className="panel" style={{display:'grid', gridTemplateColumns:'1.8fr repeat(6, 1fr)', gap:16, alignItems:'end', padding:'12px 16px', borderRadius:12, background:'#0b1223', boxShadow:'0 0 0 1px rgba(51,65,85,.5) inset', width:'100%'}}>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Search</div>
          <input ref={searchRef} placeholder="Search athlete, club, country" value={q} onChange={e => setQ(e.target.value)} style={{width:'100%', background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'8px 10px'}} />
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Sex</div>
          <select value={sex} onChange={e => setSex(e.target.value)} style={{background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'8px'}}>
            <option value="">All</option>
            <option value="F">Female</option>
            <option value="M">Male</option>
          </select>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Min runs</div>
          <select value={String(minRuns)} onChange={e => setMinRuns(Number(e.target.value))} style={{background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'8px'}}>
            <option value="0">Any</option>
            <option value="10">10+</option>
            <option value="25">25+</option>
            <option value="50">50+</option>
            <option value="100">100+</option>
          </select>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Last race from</div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'8px'}} />
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Podium</div>
          <div style={{position:'relative'}}>
            <button className="btn ghost" onClick={()=>setPodiumOpen(v=>!v)} style={{width:'100%'}}>Choose…</button>
            {podiumOpen && (
              <div className="panel" style={{position:'absolute', zIndex:5, top:'110%', right:0, width:240, background:'#0b1223', padding:'10px 12px', borderRadius:10}}>
                <div className="muted" style={{marginBottom:8}}>Select minimum counts</div>
                <div className="row" style={{justifyContent:'space-between'}}>
                  <label>#1</label>
                  <select value={String(minP1)} onChange={e=>setMinP1(Number(e.target.value))} style={{background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'6px 8px'}}>
                    <option value="0">Any</option>
                    <option value="1">1+</option>
                    <option value="3">3+</option>
                    <option value="5">5+</option>
                    <option value="10">10+</option>
                  </select>
                </div>
                <div className="row" style={{justifyContent:'space-between'}}>
                  <label>#2</label>
                  <select value={String(minP2)} onChange={e=>setMinP2(Number(e.target.value))} style={{background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'6px 8px'}}>
                    <option value="0">Any</option>
                    <option value="1">1+</option>
                    <option value="3">3+</option>
                    <option value="5">5+</option>
                    <option value="10">10+</option>
                  </select>
                </div>
                <div className="row" style={{justifyContent:'space-between'}}>
                  <label>#3</label>
                  <select value={String(minP3)} onChange={e=>setMinP3(Number(e.target.value))} style={{background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'6px 8px'}}>
                    <option value="0">Any</option>
                    <option value="1">1+</option>
                    <option value="3">3+</option>
                    <option value="5">5+</option>
                    <option value="10">10+</option>
                  </select>
                </div>
                <div className="row" style={{justifyContent:'space-between'}}>
                  <label>Top 3</label>
                  <select value={String(minTop3)} onChange={e=>setMinTop3(Number(e.target.value))} style={{background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', borderRadius:8, padding:'6px 8px'}}>
                    <option value="0">Any</option>
                    <option value="1">1+</option>
                    <option value="3">3+</option>
                    <option value="5">5+</option>
                    <option value="10">10+</option>
                  </select>
                </div>
                <div className="row" style={{justifyContent:'center', marginTop:8}}>
                  <button className="btn" style={{padding:'8px 14px'}} onClick={()=>setPodiumOpen(false)}>Apply</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="muted">Popularity</div>
          <div className="row" style={{gap:8, alignItems:'center'}}>
            <input type="range" min={1} max={10} value={popMin} onChange={e => setPopMin(Number(e.target.value))} style={{flex:1}} />
            <div className="pill">≥ {popMin}★</div>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      <div className="row" style={{gap:8, flexWrap:'wrap', marginTop:8}}>
        {q && <button className="pill active-filter" onClick={()=>setQ('')}>Search: “{q}” ×</button>}
        {sex && <button className="pill active-filter" onClick={()=>setSex('')}>Sex: {sex} ×</button>}
        {minRuns>0 && <button className="pill active-filter" onClick={()=>setMinRuns(0)}>Min runs: {minRuns}+ ×</button>}
        {dateFrom && <button className="pill active-filter" onClick={()=>setDateFrom('')}>From: {dateFrom} ×</button>}
        {minP1>0 && <button className="pill active-filter" onClick={()=>setMinP1(0)}>#1 ≥ {minP1} ×</button>}
        {minP2>0 && <button className="pill active-filter" onClick={()=>setMinP2(0)}>#2 ≥ {minP2} ×</button>}
        {minP3>0 && <button className="pill active-filter" onClick={()=>setMinP3(0)}>#3 ≥ {minP3} ×</button>}
        {minTop3>0 && <button className="pill active-filter" onClick={()=>setMinTop3(0)}>Top 3 ≥ {minTop3} ×</button>}
        {popMin>1 && <button className="pill active-filter" onClick={()=>setPopMin(1)}>Popularity ≥ {popMin}★ ×</button>}
      </div>

        <div style={{marginTop:16}}>
          <h3 style={{margin:'12px 0'}}>Top 3 Popular</h3>
          <div className="row" style={{overflowX:'auto'}}>
            {top3.map((a, idx) => (
              <div key={a.id} onClick={()=>navigate(`/runner/${a.id}`)} role="link" tabIndex={0} onKeyDown={(e)=>{if(e.key==='Enter') navigate(`/runner/${a.id}`)}} style={{textDecoration:'none', color:'inherit'}}>
                <div className="runner-card" style={{padding:'10px 12px', minWidth:260, cursor:'pointer'}}>
                  <div className="row" style={{gap:10, alignItems:'center'}}>
                    <div className="pill" style={{fontWeight:700}}>{idx+1}</div>
                    <Avatar name={a.name} src={a.avatar_url ?? undefined} size={48} />
                    <div className="card-text">
                      <div className="run-title" style={{margin:0, fontSize:16}}>{a.name}</div>
                      <div className="runner-meta" style={{marginTop:2}}>
                        <span className="pill">⭐ {a.popularity_star ?? 0}</span>
                        <span className="pill">🏁 {a.run_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      <div className="grid" style={{marginTop: 10, gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))'}}>
        {athletes.map(a => (
          <div key={a.id} onClick={()=>navigate(`/runner/${a.id}`)} role="link" tabIndex={0} onKeyDown={(e)=>{if(e.key==='Enter') navigate(`/runner/${a.id}`)}} style={{textDecoration:'none', color:'inherit'}}>
            <div className="runner-card" style={{padding:'12px 14px', cursor:'pointer'}}>
              <div className="row" style={{gap:12, alignItems:'center'}}>
                <Avatar name={a.name} src={a.avatar_url ?? undefined} size={52} />
                <div className="card-text">
                  <div className="run-title" style={{margin:0, fontSize:17, display:'flex', alignItems:'center', gap:8}}>
                    {a.name}
                    {typeof a.popularity_star === 'number' && a.popularity_star > 0 && (
                      <span className="pill" title="Popularity">{'★'.repeat(Math.max(1, a.popularity_star || 1))}</span>
                    )}
                    {(a.podium_1 || a.podium_2 || a.podium_3) ? (
                      <span className="pill" title="Podiums">🥇{a.podium_1||0} 🥈{a.podium_2||0} 🥉{a.podium_3||0}</span>
                    ) : null}
                  </div>
                  <div className="runner-meta" style={{marginTop:4}}>
                    <span>{a.club ?? 'Independent'}</span>
                    {a.country && <span>· {a.country}</span>}
                    {a.sex && <span>· {a.sex}</span>}
                    <span className="pill">🏁 {a.run_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
