type Props = {
  values: number[]
  width?: number
  height?: number
  color?: string
  gradient?: string
}

export default function Sparkline({ values, width=260, height=64, color='var(--primary)', gradient='url(#grad)' }: Props) {
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
      <circle cx={lastX} cy={lastY} r={3.5} fill={color} />
    </svg>
  )
}

