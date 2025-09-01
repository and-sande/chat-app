import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import './index.css'
import Home from './pages/Home'
import Runners from './pages/Runners'
import RunnerProfile from './pages/RunnerProfile'
// import Competitions from './pages/Competitions'
import Results from './pages/Results'
import Upcoming from './pages/Upcoming'
import Leaderboards from './pages/Leaderboards'
import CompetitionDetail from './pages/CompetitionDetail'
import NotFound from './pages/NotFound'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'runners', element: <Runners /> },
      { path: 'runner/:id', element: <RunnerProfile /> },
      { path: 'results', element: <Results /> },
      { path: 'upcoming', element: <Upcoming /> },
      { path: 'competition/:id', element: <CompetitionDetail /> },
      { path: 'leaderboards', element: <Leaderboards /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
