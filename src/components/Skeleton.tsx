export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />
}

/** Placeholder shapes matching the results layout, shown while a scan runs. */
export function ResultsSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="mt-4 h-7 w-3/5" />
        <Skeleton className="mt-3 h-4 w-4/5" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-11/12" />
        <Skeleton className="mt-2 h-4 w-3/5" />
      </div>
    </div>
  )
}
