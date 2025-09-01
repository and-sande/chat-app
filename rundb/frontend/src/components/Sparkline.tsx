import { useMemo, useState } from 'react'

type Props = {
  values: number[]
  width?: number
  height?: number
  color?: string
  gradient?: string
  showAllDots?: boolean
  labels?: string[]
  onPointClick?: (index: number) => void
}

export default function Sparkline({ values, width=260, height=64, color='var(--primary)', gradient='url(#grad)', showAllDots=true, labels, onPointClick }: Props) {
  if (!values.length) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = 4
  const scaleX = (i: number) => pad + (i * (width - pad*2)) / (values.length - 1 || 1)
  const scaleY = (v: number) => pad + (height - pad*2) * (1 - (v - min) / (max - min || 1))
  const d = values.map((v, i) => `${i===0?'M':'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ')
  const lastX = scaleX(values.length - 1)
  const lastY = scaleY(values[values.length - 1])
  const area = `${d} L ${lastX} ${height-pad} L ${pad} ${height-pad} Z`
  const [hi, setHi] = useState<number | null>(null)
  const tip = useMemo(() => {
    if (hi === null) return null
    const x = scaleX(hi)
    const y = scaleY(values[hi])
    const text = labels && labels[hi] ? labels[hi] : String(values[hi])
    return { x, y, text }
  }, [hi, values, labels])
  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={area} fill={gradient} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} />
      {showAllDots
        ? values.map((v, i) => (
            <g key={i}
               onMouseEnter={()=>setHi(i)}
               onMouseLeave={()=>setHi(prev => (prev===i? null : prev))}
               onClick={()=> onPointClick && onPointClick(i)}
               onKeyDown={(e)=> { if (e.key==='Enter' && onPointClick) onPointClick(i) }}
               role={onPointClick ? 'button' : undefined}
               tabIndex={onPointClick ? 0 : undefined}
               style={{cursor: onPointClick ? 'pointer' as const : 'default'}}
            >
              <circle cx={scaleX(i)} cy={scaleY(v)} r={7} fill={color} />
            </g>
          ))
        : (() => {
            const lastX = scaleX(values.length - 1)
            const lastY = scaleY(values[values.length - 1])
            return (
              <g onClick={()=> onPointClick && onPointClick(values.length-1)} role={onPointClick ? 'button' : undefined} tabIndex={onPointClick ? 0 : undefined} style={{cursor: onPointClick ? 'pointer' as const : 'default'}}>
                <circle cx={lastX} cy={lastY} r={7} fill={color} />
              </g>
            )
          })()
      }
      {tip && (
        <g style={{pointerEvents:'none'}}>
          <rect x={Math.min(Math.max(tip.x - 100, 2), width-200)} y={Math.max(tip.y - 40, 2)} rx="6" ry="6" width="200" height="32" fill="#0f172a" stroke="#334155" />
          <text x={Math.min(Math.max(tip.x - 94, 6), width-194)} y={Math.max(tip.y - 20, 16)} fill="#e2e8f0" fontSize="11">
            {tip.text}
          </text>
        </g>
      )}
    </svg>
  )
}
