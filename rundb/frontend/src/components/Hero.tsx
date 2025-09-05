export default function Hero({
  title,
  subtitle,
  right,
  bgImageUrl,
}: {
  title: string | React.ReactNode
  subtitle?: string | React.ReactNode
  right?: React.ReactNode
  bgImageUrl?: string
}) {
  return (
    <section className="hero">
      {bgImageUrl && (
        <div
          className="hero-bgimg"
          style={{
            backgroundImage: `url(${bgImageUrl})`,
          }}
          aria-hidden
        />
      )}
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
