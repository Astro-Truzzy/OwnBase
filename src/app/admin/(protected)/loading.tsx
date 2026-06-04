export default function AdminLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((col) => (
              <div key={col} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ))}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-52 animate-pulse rounded-xl bg-muted" />
        <div className="h-52 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
