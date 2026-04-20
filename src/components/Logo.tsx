/**
 * Ownbase product logo: laptop + key.
 * Use className for size/color (e.g. "h-8 w-8 text-accent").
 */
export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      {/* Laptop screen */}
      <rect
        x="5"
        y="6"
        width="14"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {/* Screen line */}
      <path
        d="M8 10h8"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Laptop base */}
      <path
        d="M4 16h18a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Key: bow + shaft + teeth */}
      <circle cx="22" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M24 10h3v5h-3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25 12v1.5M26 12v1.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
