import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar'
import { useEffect, useState } from 'react'
import { api, type SearchItem } from '../lib/api'

export default function NavBar() {
  const nav = useNavigate()
  const loc = useLocation()
  const [items, setItems] = useState<SearchItem[]>([])
  useEffect(() => {
    let mounted = true
    Promise.all([api.events(), api.runners()])
      .then(([events, runners]) => {
        if (!mounted) return
        const out: SearchItem[] = [
          ...events.map(e => ({ type: 'event' as const, id: e.id, label: `🏁 ${e.name}` })),
          ...runners.map(r => ({ type: 'runner' as const, id: r.id, label: `🏃 ${r.name}` })),
        ]
        setItems(out)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])
  return (
    <nav className="navbar">
      <Link to="/" className="brand" aria-label="Go home">
        <img className="brand-mark brand-wide" src="/logo.svg" alt="RunDB" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/logo.png'}} />
      </Link>
      <div className="navlinks" style={{display:'flex', alignItems:'center', gap:16}}>
        <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/runners" className={({isActive}) => isActive ? 'active' : ''}>Athletes</NavLink>
        <NavLink to="/results" className={({isActive}) => isActive ? 'active' : ''}>Results</NavLink>
        <NavLink to="/upcoming" className={({isActive}) => isActive ? 'active' : ''}>Upcoming</NavLink>
        <NavLink to="/leaderboards" className={({isActive}) => isActive ? 'active' : ''}>Leaderboards</NavLink>
        <div style={{minWidth: 420, maxWidth: 560}}>
          <SearchBar<SearchItem>
            data={items}
            display={(it) => it.label}
            onSelect={(it) => {
              if (it.type === 'runner') nav(`/runner/${it.id}`)
              if (it.type === 'event') nav(`/competition/${it.id}`)
            }}
            placeholder="Search athletes and events"
            autoFocus={loc.pathname === '/'}
          />
        </div>
      </div>
    </nav>
  )
}
