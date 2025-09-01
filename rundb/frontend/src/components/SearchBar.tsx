import { useEffect, useMemo, useState } from 'react'

type Props<T> = {
  data: T[]
  onSelect: (item: T) => void
  placeholder?: string
  display: (item: T) => string
}

export default function SearchBar<T>({ data, onSelect, placeholder, display }: Props<T>) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(q.trim().length > 0)
  }, [q])

  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return [] as T[]
    return data.filter((d) => display(d).toLowerCase().includes(query)).slice(0, 8)
  }, [q, data, display])

  return (
    <div className="panel" style={{position: 'relative'}}>
      <input
        className="input"
        placeholder={placeholder ?? 'Search...'}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(q.trim().length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && results.length > 0 && (
        <div style={{position:'absolute', top: '100%', left: 0, right: 0, background: '#0f1322', border: '1px solid #22283a', borderRadius: 10, marginTop: 6}}>
          {results.map((r, i) => (
            <button key={i} className="btn ghost" style={{display:'block', width:'100%', textAlign:'left', padding: '10px 12px', border: 'none'}} onClick={() => onSelect(r)}>
              {display(r)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

