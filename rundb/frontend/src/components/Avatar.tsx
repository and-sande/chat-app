export default function Avatar({ name, size=44, src }: { name: string; size?: number; src?: string }) {
  const initials = name.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          objectFit: 'cover',
          border: '1px solid var(--line)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
        }}
      />
    )
  }
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 999,
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(135deg, #1a2a3d, #123b27)',
      color: '#d7ffe7',
      fontWeight: 800,
      letterSpacing: .3,
      border: '1px solid var(--line)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
    }}>{initials}</div>
  )
}
