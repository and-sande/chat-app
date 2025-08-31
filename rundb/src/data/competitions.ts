import type { Competition } from './types'

export const competitions: Competition[] = [
  {
    id: 'c1',
    name: 'City 5K Sprint',
    date: '2025-04-14',
    location: 'Oslo, NO',
    distanceKm: 5,
    imageUrl: 'https://images.unsplash.com/photo-1541519481457-763224276691?q=80&w=1200&auto=format&fit=crop',
    organizer: 'Oslo Road Runners',
    homepage: 'https://example.org/city-5k',
  },
  {
    id: 'c2',
    name: 'River Run 10K',
    date: '2025-05-20',
    location: 'Bergen, NO',
    distanceKm: 10,
    imageUrl: 'https://images.unsplash.com/photo-1533669955142-6a73332af4db?q=80&w=1200&auto=format&fit=crop',
    organizer: 'Bergen Track Club',
    homepage: 'https://example.org/river-10k',
  },
  {
    id: 'c3',
    name: 'Nordic Half Marathon',
    date: '2025-06-10',
    location: 'Trondheim, NO',
    distanceKm: 21.0975,
    imageUrl: 'https://images.unsplash.com/photo-1520975922284-8b456906c813?q=80&w=1200&auto=format&fit=crop',
    organizer: 'Trondheim AC',
    homepage: 'https://example.org/nordic-half',
  },
  {
    id: 'c4',
    name: 'Summer Track 5K',
    date: '2025-07-01',
    location: 'Oslo, NO',
    distanceKm: 5,
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop',
    organizer: 'Oslo Athletics',
    homepage: 'https://example.org/summer-5k',
  },
  {
    id: 'c5',
    name: 'Coastal 10K',
    date: '2025-08-18',
    location: 'Stavanger, NO',
    distanceKm: 10,
    imageUrl: 'https://images.unsplash.com/photo-1540058404349-2dd6335b9979?q=80&w=1200&auto=format&fit=crop',
    organizer: 'Stavanger Runners',
    homepage: 'https://example.org/coastal-10k',
  },
]

export const byId = new Map(competitions.map(c => [c.id, c]))
