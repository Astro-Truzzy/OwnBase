"use client";

/**
 * Dashboard interface showing repository access control.
 * Secure code vault / access management visual.
 */
export function SolutionIllustration() {
  return (
    <svg
      viewBox="0 0 440 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-md mx-auto h-auto"
      aria-hidden
    >
      {/* Card container */}
      <rect
        x="20"
        y="20"
        width="400"
        height="260"
        rx="12"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1"
      />
      {/* Header */}
      <rect x="32" y="32" width="376" height="28" rx="6" fill="var(--background)" />
      <circle cx="48" cy="46" r="4" fill="var(--muted)" fillOpacity="0.6" />
      <circle cx="64" cy="46" r="4" fill="var(--muted)" fillOpacity="0.6" />
      <circle cx="80" cy="46" r="4" fill="var(--muted)" fillOpacity="0.6" />
      <rect x="100" y="42" width="140" height="6" rx="3" fill="var(--border)" fillOpacity="0.5" />
      {/* Sidebar — repos */}
      <rect x="32" y="72" width="100" height="196" rx="8" fill="var(--background)" />
      <rect x="44" y="88" width="76" height="6" rx="2" fill="var(--muted)" fillOpacity="0.7" />
      <rect x="44" y="102" width="60" height="6" rx="2" fill="var(--accent)" fillOpacity="0.5" />
      <rect x="44" y="116" width="68" height="6" rx="2" fill="var(--muted)" fillOpacity="0.5" />
      <rect x="44" y="130" width="56" height="6" rx="2" fill="var(--muted)" fillOpacity="0.5" />
      <rect x="44" y="144" width="72" height="6" rx="2" fill="var(--muted)" fillOpacity="0.5" />
      {/* Main — access control table */}
      <rect x="148" y="72" width="260" height="196" rx="8" fill="var(--background)" stroke="var(--border)" strokeWidth="0.5" />
      <rect x="164" y="88" width="100" height="6" rx="2" fill="var(--muted)" fillOpacity="0.7" />
      <rect x="280" y="88" width="80" height="6" rx="2" fill="var(--muted)" fillOpacity="0.7" />
      <rect x="364" y="88" width="28" height="6" rx="2" fill="var(--muted)" fillOpacity="0.7" />
      {/* Table rows */}
      {[112, 132, 152, 172, 192].map((y, i) => (
        <g key={i}>
          <rect x="164" y={y} width="120" height="6" rx="2" fill="var(--border)" fillOpacity={i === 0 ? 0.5 : 0.35} />
          <rect x="296" y={y} width="60" height="6" rx="2" fill="var(--border)" fillOpacity="0.35" />
          <rect x="368" y={y} width="24" height="14" rx="4" fill={i === 0 ? "var(--accent)" : "var(--border)"} fillOpacity={i === 0 ? 0.4 : 0.25} />
        </g>
      ))}
      {/* Shield / lock accent */}
      <rect x="148" y="72" width="4" height="196" rx="2" fill="var(--accent)" />
    </svg>
  );
}
