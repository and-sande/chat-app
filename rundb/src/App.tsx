import { Outlet } from 'react-router-dom'
import NavBar from './components/NavBar'

function App() {
  return (
    <div className="container">
      <NavBar />
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">
        <span>RunDB · Find results. Celebrate runs.</span>
      </footer>
    </div>
  )
}

export default App

