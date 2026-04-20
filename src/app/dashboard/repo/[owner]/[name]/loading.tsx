export default function RepoDetailLoading() {
  return (
    <div className="space-y-8">
      <div className="animate-pulse">
        <div className="h-4 w-24 rounded bg-border" />
        <div className="mt-6 h-8 w-64 rounded bg-border" />
        <div className="mt-3 h-4 w-full max-w-md rounded bg-border" />
        <div className="mt-3 h-4 w-32 rounded bg-border" />
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="h-48 animate-pulse rounded-xl border border-border bg-surface" />
    </div>
  );
}
