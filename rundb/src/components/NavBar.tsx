import { Link, NavLink } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav className="navbar">
      <Link to="/" className="brand" aria-label="Go home">
        <img className="brand-mark brand-wide" src="/logo.svg" alt="RunDB" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/logo.png'}} />
      </Link>
      <div className="navlinks">
        <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/runners" className={({isActive}) => isActive ? 'active' : ''}>Runners</NavLink>
        <NavLink to="/competitions" className={({isActive}) => isActive ? 'active' : ''}>Competitions</NavLink>
        <NavLink to="/leaderboards" className={({isActive}) => isActive ? 'active' : ''}>Leaderboards</NavLink>
      </div>
    </nav>
  )
}
