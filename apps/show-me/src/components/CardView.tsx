export function CardView({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 shadow-sm">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        show-me
      </div>
      <h2 className="mt-1.5 mb-5 text-xl font-semibold text-card-foreground">
        {title}
      </h2>
      <ul className="grid gap-3">
        {points.map((p, i) => (
          <li key={i} className="flex items-baseline gap-3 text-[15px] leading-relaxed">
            <span className="flex size-[22px] flex-none translate-y-[3px] items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
              {i + 1}
            </span>
            <span className="text-foreground/80">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
