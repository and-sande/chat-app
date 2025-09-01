import type { Runner } from './types'

export const runners: Runner[] = [
  {
    id: 'r1',
    name: 'Anna Larsen',
    age: 29,
    club: 'Oslo Road Runners',
    country: 'NO',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna%20Larsen',
    results: [
      { competitionId: 'c1', timeSec: 1235, position: 2, date: '2025-04-14' },
      { competitionId: 'c2', timeSec: 2640, position: 5, date: '2025-05-20' },
      { competitionId: 'c4', timeSec: 1210, position: 1, date: '2025-07-01' },
      { competitionId: 'c5', timeSec: 2602, position: 3, date: '2025-08-18' },
    ],
  },
  {
    id: 'r2',
    name: 'Mikael Johansen',
    age: 34,
    club: 'Bergen Track Club',
    country: 'NO',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mikael%20Johansen',
    results: [
      { competitionId: 'c1', timeSec: 1450, position: 20, date: '2025-04-14' },
      { competitionId: 'c2', timeSec: 2901, position: 41, date: '2025-05-20' },
      { competitionId: 'c3', timeSec: 5660, position: 35, date: '2025-06-10' },
      { competitionId: 'c5', timeSec: 2820, position: 22, date: '2025-08-18' },
    ],
  },
  {
    id: 'r3',
    name: 'Sofia Nilsen',
    age: 24,
    club: 'Trondheim AC',
    country: 'NO',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia%20Nilsen',
    results: [
      { competitionId: 'c1', timeSec: 1188, position: 1, date: '2025-04-14' },
      { competitionId: 'c4', timeSec: 1196, position: 2, date: '2025-07-01' },
    ],
  },
  {
    id: 'r4',
    name: 'Jonas Berg',
    age: 41,
    club: 'Independent',
    country: 'NO',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jonas%20Berg',
    results: [
      { competitionId: 'c2', timeSec: 2520, position: 1, date: '2025-05-20' },
      { competitionId: 'c5', timeSec: 2550, position: 2, date: '2025-08-18' },
    ],
  },
]
