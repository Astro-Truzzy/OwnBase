"use client";

export function DashboardIllustration() {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-md mx-auto h-auto"
      aria-hidden
    >
      {/* Background card */}
      <rect
        x="20"
        y="20"
        width="360"
        height="240"
        rx="12"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1"
      />
      {/* Header bar */}
      <rect x="32" y="32" width="336" height="24" rx="4" fill="var(--border)" fillOpacity="0.5" />
      <circle cx="44" cy="44" r="4" fill="var(--muted)" fillOpacity="0.6" />
      <circle cx="60" cy="44" r="4" fill="var(--muted)" fillOpacity="0.6" />
      <circle cx="76" cy="44" r="4" fill="var(--muted)" fillOpacity="0.6" />
      {/* Sidebar */}
      <rect x="32" y="68" width="72" height="180" rx="6" fill="var(--background)" />
      <rect x="44" y="84" width="48" height="8" rx="2" fill="var(--border)" fillOpacity="0.6" />
      <rect x="44" y="100" width="48" height="8" rx="2" fill="var(--accent)" fillOpacity="0.3" />
      <rect x="44" y="116" width="48" height="8" rx="2" fill="var(--border)" fillOpacity="0.6" />
      <rect x="44" y="132" width="48" height="8" rx="2" fill="var(--border)" fillOpacity="0.6" />
      {/* Main content blocks */}
      <rect x="120" y="68" width="120" height="80" rx="6" fill="var(--background)" stroke="var(--border)" strokeWidth="0.5" />
      <rect x="252" y="68" width="116" height="80" rx="6" fill="var(--background)" stroke="var(--border)" strokeWidth="0.5" />
      <rect x="120" y="160" width="248" height="88" rx="6" fill="var(--background)" stroke="var(--border)" strokeWidth="0.5" />
      {/* Content lines */}
      <rect x="132" y="84" width="80" height="6" rx="2" fill="var(--border)" fillOpacity="0.5" />
      <rect x="132" y="96" width="96" height="6" rx="2" fill="var(--border)" fillOpacity="0.5" />
      <rect x="264" y="84" width="60" height="6" rx="2" fill="var(--border)" fillOpacity="0.5" />
      <rect x="132" y="176" width="100" height="6" rx="2" fill="var(--border)" fillOpacity="0.5" />
      <rect x="132" y="192" width="220" height="6" rx="2" fill="var(--border)" fillOpacity="0.4" />
      <rect x="132" y="208" width="180" height="6" rx="2" fill="var(--border)" fillOpacity="0.4" />
      {/* Accent highlight */}
      <rect x="120" y="68" width="4" height="80" rx="2" fill="var(--accent)" />
    </svg>
  );
}
