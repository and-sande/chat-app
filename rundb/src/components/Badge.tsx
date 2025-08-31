type Props = {
  label: string
  tone?: 'default' | 'success' | 'warn'
  icon?: string
}

export default function Badge({ label, tone = 'default', icon }: Props) {
  return (
    <span className={`badge ${tone}`}>
      {icon && <span className="icon" aria-hidden>{icon}</span>}
      {label}
    </span>
  )
}

