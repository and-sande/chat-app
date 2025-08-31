export default function Hero({
  title,
  subtitle,
  right,
}: {
  title: string | React.ReactNode
  subtitle?: string | React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div>
          <h1 className="hero-title">{title}</h1>
          {subtitle && <div className="hero-subtitle">{subtitle}</div>}
        </div>
        {right && <div className="hero-right">{right}</div>}
      </div>
    </section>
  )
}

