export default function UsersLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-40 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="space-y-px bg-muted/20">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 bg-card">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-12 animate-pulse rounded bg-muted" />
              <div className="ml-auto h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
