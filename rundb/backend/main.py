from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import math
import sqlite3
import os
from datetime import datetime

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, 'rundb.db')

def get_conn():
    return sqlite3.connect(DB_PATH)

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    # Core tables
    cur.execute('''
        CREATE TABLE IF NOT EXISTS rundb_events (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT,
            location_city TEXT,
            location_country TEXT,
            organizer TEXT,
            homepage TEXT,
            sport TEXT,
            level TEXT,
            signup_begin TEXT,
            signup_end TEXT,
            image_url TEXT,
            premium INTEGER DEFAULT 0,
            enrolled_count INTEGER DEFAULT 0,
            distance_km REAL
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS rundb_event_races (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            name TEXT NOT NULL,
            start_time TEXT,
            FOREIGN KEY(event_id) REFERENCES rundb_events(id)
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS rundb_runners (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            sex TEXT,
            date TEXT,
            club TEXT,
            country TEXT,
            avatar_url TEXT
        )
    ''')

    # Ensure new columns exist when migrating older DBs
    cur.execute("PRAGMA table_info(rundb_runners)")
    cols = [r[1] for r in cur.fetchall()]
    if 'sex' not in cols:
        cur.execute('ALTER TABLE rundb_runners ADD COLUMN sex TEXT')
    if 'date' not in cols:
        cur.execute('ALTER TABLE rundb_runners ADD COLUMN date TEXT')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS rundb_results (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            race_id TEXT,
            runner_id TEXT,
            finish INTEGER,
            bib_number TEXT,
            name TEXT,
            nation TEXT,
            club TEXT,
            class TEXT,
            time TEXT,
            time_sec INTEGER,
            behind TEXT,
            date TEXT NOT NULL,
            FOREIGN KEY(event_id) REFERENCES rundb_events(id),
            FOREIGN KEY(race_id) REFERENCES rundb_event_races(id),
            FOREIGN KEY(runner_id) REFERENCES rundb_runners(id)
        )
    ''')

    # Seed if empty
    cur.execute('SELECT COUNT(*) FROM rundb_events')
    if (cur.fetchone() or [0])[0] == 0:
        events = [
            ("evt-balestrand-2025", "Balestrand Opp og Rundt 2025", "2025-09-06", "13:30", "Balestrand", "NOR", "Balestrand IL", "https://balestrandopp.com/", "Annet", "Ingen", "2025-01-02T00:00:00", "2025-09-06T13:00:00", None, 1, 120, None),
            ("evt-numedalslopet-2025", "Numedalsløpet 2025", "2025-09-06", None, "Flesberg", "NOR", "Svene IL", "https://www.svene.no/WPPillot/numedalslopet/", "Terrengløp", "Nasjonalt stevne", None, None, None, 0, 220, None),
        ]
        cur.executemany('''
            INSERT INTO rundb_events (id, name, date, start_time, location_city, location_country, organizer, homepage, sport, level, signup_begin, signup_end, image_url, premium, enrolled_count, distance_km)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', events)

        races = [
            ("race-bale-1", "evt-balestrand-2025", "Balestrand Opp og Rundt Konkurranse", "13:30"),
            ("race-num-1", "evt-numedalslopet-2025", "Numedalsløpet", "00:00"),
        ]
        cur.executemany('''
            INSERT INTO rundb_event_races (id, event_id, name, start_time)
            VALUES (?, ?, ?, ?)
        ''', races)

        runners = [
            ("r1", "Anna Larsen", "F", "1996-04-12", "Oslo Road Runners", "NOR", "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna%20Larsen"),
            ("r2", "Mikael Johansen", "M", "1993-07-09", "Bergen Track Club", "NOR", "https://api.dicebear.com/7.x/avataaars/svg?seed=Mikael%20Johansen"),
            ("r3", "Sofia Nilsen", "F", "1998-01-23", "Trondheim AC", "NOR", "https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia%20Nilsen"),
        ]
        cur.executemany('''
            INSERT INTO rundb_runners (id, name, sex, date, club, country, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', runners)

        results = [
            ("res-bale-1", "evt-balestrand-2025", "race-bale-1", "r3", 1, "12", "Sofia Nilsen", "NOR", "Trondheim AC", "K F20-34", "19:54", 1194, None, "2025-09-06"),
            ("res-bale-2", "evt-balestrand-2025", "race-bale-1", "r1", 2, "45", "Anna Larsen", "NOR", "Oslo Road Runners", "K F20-34", "20:30", 1230, "+0:36", "2025-09-06"),
            ("res-bale-3", "evt-balestrand-2025", "race-bale-1", None, 3, "101", "Eva Berg", "NOR", "Independent", "K F35-39", "21:15", 1275, "+1:21", "2025-09-06"),
            ("res-num-1", "evt-numedalslopet-2025", "race-num-1", None, 1, "7", "Per Hansen", "NOR", "Svene IL", "M Senior", "35:10", 2110, None, "2025-09-06"),
            ("res-num-2", "evt-numedalslopet-2025", "race-num-1", "r2", 2, "28", "Mikael Johansen", "NOR", "Bergen Track Club", "M Senior", "36:05", 2165, "+0:55", "2025-09-06"),
            ("res-num-3", "evt-numedalslopet-2025", "race-num-1", None, 3, "55", "Jonas Berg", "NOR", "Independent", "M Senior", "36:10", 2170, "+1:00", "2025-09-06"),
            ("res-num-4", "evt-numedalslopet-2025", "race-num-1", "r1", 12, "88", "Anna Larsen", "NOR", "Oslo Road Runners", "K F20-34", "42:30", 2550, "+7:20", "2025-09-06"),
            ("res-bale-4", "evt-balestrand-2025", "race-bale-1", "r2", 8, "33", "Mikael Johansen", "NOR", "Bergen Track Club", "M Senior", "22:10", 1330, "+2:16", "2025-09-06"),
        ]
        cur.executemany('''
            INSERT INTO rundb_results (id, event_id, race_id, runner_id, finish, bib_number, name, nation, club, class, time, time_sec, behind, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', results)

    conn.commit()
    conn.close()


# Pydantic models
class EventRace(BaseModel):
    id: str
    event_id: str
    name: str
    start_time: Optional[str] = None

class Event(BaseModel):
    id: str
    name: str
    date: str
    start_time: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    organizer: Optional[str] = None
    homepage: Optional[str] = None
    sport: Optional[str] = None
    level: Optional[str] = None
    signup_begin: Optional[str] = None
    signup_end: Optional[str] = None
    image_url: Optional[str] = None
    premium: bool = False
    enrolled_count: int = 0
    distance_km: Optional[float] = None
    races: List[EventRace] = []

class RDRunner(BaseModel):
    id: str
    name: str
    sex: Optional[str] = None
    date: Optional[str] = None
    club: Optional[str] = None
    country: Optional[str] = None
    avatar_url: Optional[str] = None

class ResultRow(BaseModel):
    id: str
    event_id: str
    race_id: Optional[str] = None
    runner_id: Optional[str] = None
    finish: Optional[int] = None
    bib_number: Optional[str] = None
    name: Optional[str] = None
    nation: Optional[str] = None
    club: Optional[str] = None
    class_field: Optional[str] = None
    time: Optional[str] = None
    time_sec: Optional[int] = None
    behind: Optional[str] = None
    date: str

class Stats(BaseModel):
    runners_count: int
    events_count: int
    results_count: int

class SearchItem(BaseModel):
    type: str
    id: str
    label: str

class AthleteSummary(BaseModel):
    id: str
    name: str
    sex: Optional[str] = None
    date: Optional[str] = None
    club: Optional[str] = None
    country: Optional[str] = None
    avatar_url: Optional[str] = None
    run_count: int
    last_race_date: Optional[str] = None
    podium_1: int = 0
    podium_2: int = 0
    podium_3: int = 0
    podium_top3: int = 0
    popularity: int = 0
    popularity_star: int = 0


app = FastAPI(title='RunDB API', version='0.1.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
    ],
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
def on_startup():
    init_db()


@app.get('/rundb/events', response_model=List[Event])
def list_events(upcoming: Optional[bool] = None):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT * FROM rundb_events')
    rows = cur.fetchall()
    events: List[Event] = []
    for row in rows:
        e = Event(
            id=row[0], name=row[1], date=row[2], start_time=row[3],
            location_city=row[4], location_country=row[5], organizer=row[6], homepage=row[7],
            sport=row[8], level=row[9], signup_begin=row[10], signup_end=row[11], image_url=row[12],
            premium=bool(row[13] or 0), enrolled_count=row[14] or 0, distance_km=row[15], races=[]
        )
        events.append(e)
    # attach races
    cur.execute('SELECT id, event_id, name, start_time FROM rundb_event_races')
    race_rows = cur.fetchall()
    by_event = {}
    for r in race_rows:
        er = EventRace(id=r[0], event_id=r[1], name=r[2], start_time=r[3])
        by_event.setdefault(er.event_id, []).append(er)
    for e in events:
        e.races = by_event.get(e.id, [])
    conn.close()

    if upcoming:
        today = datetime.now().date()
        def is_up(e: Event):
            try:
                d = datetime.fromisoformat(e.date).date()
                date_ok = d >= today
            except Exception:
                date_ok = True
            signup_ok = False
            if e.signup_end:
                try:
                    se = datetime.fromisoformat(e.signup_end)
                    signup_ok = se.date() >= today
                except Exception:
                    signup_ok = False
            return date_ok or signup_ok
        events = [e for e in events if is_up(e)]
        events.sort(key=lambda x: x.date)
    return events


@app.get('/rundb/events/{event_id}', response_model=Event)
def event_detail(event_id: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT * FROM rundb_events WHERE id = ?', (event_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail='Event not found')
    e = Event(
        id=row[0], name=row[1], date=row[2], start_time=row[3],
        location_city=row[4], location_country=row[5], organizer=row[6], homepage=row[7],
        sport=row[8], level=row[9], signup_begin=row[10], signup_end=row[11], image_url=row[12],
        premium=bool(row[13] or 0), enrolled_count=row[14] or 0, distance_km=row[15], races=[]
    )
    cur.execute('SELECT id, event_id, name, start_time FROM rundb_event_races WHERE event_id = ?', (event_id,))
    e.races = [EventRace(id=r[0], event_id=r[1], name=r[2], start_time=r[3]) for r in cur.fetchall()]
    conn.close()
    return e


@app.get('/rundb/events/{event_id}/results', response_model=List[ResultRow])
def event_results(event_id: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('''
        SELECT id, event_id, race_id, runner_id, finish, bib_number, name, nation, club, class, time, time_sec, behind, date
        FROM rundb_results
        WHERE event_id = ?
        ORDER BY CASE WHEN finish IS NULL THEN 99999 ELSE finish END ASC, time_sec ASC
    ''', (event_id,))
    rows = cur.fetchall()
    conn.close()
    out: List[ResultRow] = []
    for r in rows:
        out.append(ResultRow(
            id=r[0], event_id=r[1], race_id=r[2], runner_id=r[3], finish=r[4], bib_number=r[5],
            name=r[6], nation=r[7], club=r[8], class_field=r[9], time=r[10], time_sec=r[11], behind=r[12], date=r[13]
        ))
    return out


@app.get('/rundb/runners', response_model=List[RDRunner])
def list_runners():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT id, name, sex, date, club, country, avatar_url FROM rundb_runners')
    rows = cur.fetchall()
    conn.close()
    return [RDRunner(id=r[0], name=r[1], sex=r[2], date=r[3], club=r[4], country=r[5], avatar_url=r[6]) for r in rows]


@app.get('/rundb/runners/{runner_id}', response_model=RDRunner)
def runner_detail(runner_id: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT id, name, sex, date, club, country, avatar_url FROM rundb_runners WHERE id = ?', (runner_id,))
    r = cur.fetchone()
    conn.close()
    if not r:
        raise HTTPException(status_code=404, detail='Runner not found')
    return RDRunner(id=r[0], name=r[1], sex=r[2], date=r[3], club=r[4], country=r[5], avatar_url=r[6])


# Latest results endpoint for convenience
@app.get('/rundb/results', response_model=List[ResultRow])
def latest_results(limit: int = 100):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('''
        SELECT id, event_id, race_id, runner_id, finish, bib_number, name, nation, club, class, time, time_sec, behind, date
        FROM rundb_results
        ORDER BY date DESC, CASE WHEN finish IS NULL THEN 99999 ELSE finish END ASC
        LIMIT ?
    ''', (limit,))
    rows = cur.fetchall()
    conn.close()
    return [
        ResultRow(
            id=r[0], event_id=r[1], race_id=r[2], runner_id=r[3], finish=r[4], bib_number=r[5],
            name=r[6], nation=r[7], club=r[8], class_field=r[9], time=r[10], time_sec=r[11], behind=r[12], date=r[13]
        ) for r in rows
    ]


@app.get('/rundb/runners/{runner_id}/results', response_model=List[ResultRow])
def runner_results(runner_id: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('''
        SELECT id, event_id, race_id, runner_id, finish, bib_number, name, nation, club, class, time, time_sec, behind, date
        FROM rundb_results
        WHERE runner_id = ?
        ORDER BY date DESC, CASE WHEN finish IS NULL THEN 99999 ELSE finish END ASC
    ''', (runner_id,))
    rows = cur.fetchall()
    conn.close()
    return [
        ResultRow(
            id=r[0], event_id=r[1], race_id=r[2], runner_id=r[3], finish=r[4], bib_number=r[5],
            name=r[6], nation=r[7], club=r[8], class_field=r[9], time=r[10], time_sec=r[11], behind=r[12], date=r[13]
        ) for r in rows
    ]


@app.get('/rundb/stats', response_model=Stats)
def stats():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM rundb_runners')
    rc = (cur.fetchone() or [0])[0]
    cur.execute('SELECT COUNT(*) FROM rundb_events')
    ec = (cur.fetchone() or [0])[0]
    cur.execute('SELECT COUNT(*) FROM rundb_results')
    resc = (cur.fetchone() or [0])[0]
    conn.close()
    return Stats(runners_count=rc, events_count=ec, results_count=resc)


@app.get('/rundb/search', response_model=List[SearchItem])
def search(q: str):
    like = f"%{q.strip()}%"
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT id, name FROM rundb_events WHERE name LIKE ?', (like,))
    evs = [SearchItem(type='event', id=row[0], label='🏁 ' + row[1]) for row in cur.fetchall()]
    cur.execute('SELECT id, name FROM rundb_runners WHERE name LIKE ?', (like,))
    runs = [SearchItem(type='runner', id=row[0], label='🏃 ' + row[1]) for row in cur.fetchall()]
    conn.close()
    return evs + runs


@app.get('/rundb/athletes', response_model=List[AthleteSummary])
def athletes(
    q: Optional[str] = None,
    sex: Optional[str] = None,
    min_runs: int = 0,
    date_from: Optional[str] = None,
    podium: Optional[str] = None,  # '1' | '2' | '3' | 'top3'
    top: Optional[str] = None,     # 'popular3'
    min_p1: int = 0,
    min_p2: int = 0,
    min_p3: int = 0,
    min_top3: int = 0,
    popularity_min: Optional[int] = None,
    popularity_max: Optional[int] = None,
):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('''
        SELECT r.id, r.name, r.sex, r.date, r.club, r.country, r.avatar_url,
               COUNT(res.id) as run_count,
               MAX(res.date) as last_race_date,
               SUM(CASE WHEN res.finish = 1 THEN 1 ELSE 0 END) as p1,
               SUM(CASE WHEN res.finish = 2 THEN 1 ELSE 0 END) as p2,
               SUM(CASE WHEN res.finish = 3 THEN 1 ELSE 0 END) as p3
        FROM rundb_runners r
        LEFT JOIN rundb_results res ON res.runner_id = r.id
        GROUP BY r.id
        ORDER BY r.name ASC
    ''')
    rows = cur.fetchall()
    conn.close()
    out: List[AthleteSummary] = []
    for r in rows:
        p1 = int(r[9] or 0)
        p2 = int(r[10] or 0)
        p3 = int(r[11] or 0)
        top3 = p1 + p2 + p3
        run_count = int(r[7] or 0)
        # Popularity: base on activity + podiums
        popularity = run_count + (p1 * 5) + (p2 * 3) + (p3 * 2)
        out.append(AthleteSummary(
            id=r[0], name=r[1], sex=r[2], date=r[3], club=r[4], country=r[5], avatar_url=r[6],
            run_count=run_count, last_race_date=r[8],
            podium_1=p1, podium_2=p2, podium_3=p3, podium_top3=top3,
            popularity=popularity,
            popularity_star=0,
        ))

    # Compute 1-10 star scale relative to max popularity
    max_pop = max((a.popularity for a in out), default=0)
    if max_pop > 0:
        for a in out:
            a.popularity_star = max(1, int(math.ceil(a.popularity / max_pop * 10)))
    else:
        for a in out:
            a.popularity_star = 1

    # Apply filters in-process to keep query simple
    if q:
        ql = q.strip().lower()
        out = [a for a in out if (f"{a.name} {a.club or ''} {a.country or ''}").lower().find(ql) >= 0]
    if sex:
        sx = sex.strip().lower()
        out = [a for a in out if (a.sex or '').lower() == sx]
    if min_runs and min_runs > 0:
        out = [a for a in out if (a.run_count or 0) >= min_runs]
    if date_from:
        out = [a for a in out if a.last_race_date and str(a.last_race_date) >= date_from]
    if podium:
        if podium == '1':
            out = [a for a in out if a.podium_1 > 0]
        elif podium == '2':
            out = [a for a in out if a.podium_2 > 0]
        elif podium == '3':
            out = [a for a in out if a.podium_3 > 0]
        elif podium == 'top3':
            out = [a for a in out if a.podium_top3 > 0]

    # Minimum podium thresholds
    if min_p1 and min_p1 > 0:
        out = [a for a in out if (a.podium_1 or 0) >= min_p1]
    if min_p2 and min_p2 > 0:
        out = [a for a in out if (a.podium_2 or 0) >= min_p2]
    if min_p3 and min_p3 > 0:
        out = [a for a in out if (a.podium_3 or 0) >= min_p3]
    if min_top3 and min_top3 > 0:
        out = [a for a in out if (a.podium_top3 or 0) >= min_top3]

    # Popularity star filter (1..10)
    if popularity_min is not None:
        try:
            pm = int(popularity_min)
            out = [a for a in out if a.popularity_star >= pm]
        except Exception:
            pass
    if popularity_max is not None:
        try:
            px = int(popularity_max)
            out = [a for a in out if a.popularity_star <= px]
        except Exception:
            pass

    if top == 'popular3':
        out = sorted(out, key=lambda a: a.popularity, reverse=True)[:3]
    else:
        # Default sort by name
        out = sorted(out, key=lambda a: a.name)

    return out


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8001)
