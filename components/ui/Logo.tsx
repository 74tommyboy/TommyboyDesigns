import Link from 'next/link'

interface Props {
  className?: string
  linkWrapper?: boolean
}

function DogTag({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cord / neck line */}
      <line
        x1="18" y1="0"
        x2="18" y2="10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Chain loop at top of tag */}
      <circle
        cx="18" cy="14"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Dog tag body */}
      <rect
        x="2" y="16"
        width="32" height="46"
        rx="7"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Engraved TBD text */}
      <text
        x="18" y="47"
        textAnchor="middle"
        fill="currentColor"
        fontSize="13"
        fontFamily="'Bebas Neue', Impact, sans-serif"
        letterSpacing="2"
      >
        TBD
      </text>

      {/* Subtle engraved line above text */}
      <line
        x1="8" y1="36"
        x2="28" y2="36"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeOpacity="0.4"
      />

      {/* Subtle engraved line below text */}
      <line
        x1="8" y1="52"
        x2="28" y2="52"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeOpacity="0.4"
      />
    </svg>
  )
}

export function LogoMark({ className = '' }: { className?: string }) {
  return <DogTag className={className} />
}

export default function Logo({ linkWrapper = true }: Props) {
  const inner = (
    <div className="flex items-center gap-3 group">
      <DogTag className="h-12 w-auto text-amber-bourbon group-hover:text-amber-light transition-colors duration-300" />
      <div>
        <div className="font-display text-white text-xl tracking-[0.12em] leading-none">
          TOMMYBOY
        </div>
        <div className="font-display text-amber-bourbon text-[10px] tracking-[0.4em] leading-none group-hover:text-amber-light transition-colors duration-300">
          DESIGNS
        </div>
        <div className="text-steel/50 text-[8px] tracking-[0.25em] leading-none mt-1 italic">
          Raise the bar.
        </div>
      </div>
    </div>
  )

  if (!linkWrapper) return inner

  return (
    <Link href="/" aria-label="TommyboyDesigns home">
      {inner}
    </Link>
  )
}
