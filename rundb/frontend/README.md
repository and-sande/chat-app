RunDB
=====

RunDB is a React + Vite single-page app to browse runners, competitions, and results, with simple social-style badges for activity and performance.

What’s included
- React Router navigation: Home, Runners, Runner Profile, Competitions
- Mock data for runners, competitions, results
- Badge engine: Active Runner, Podium Finisher, Speedster, Consistent
- Minimal styling without external CSS frameworks

Local development
1) From the `rundb` folder, install dependencies:
   npm install
2) Start the dev server:
   npm run dev
3) Open http://localhost:5175

Build
   npm run build
   npm run preview

Notes
- This demo uses mock data and a deterministic "today" in `src/lib/badges.ts` for consistent badge results. Replace with `new Date()` when wiring real data.
- You can replace or extend the data in `src/data` to integrate with a backend.

