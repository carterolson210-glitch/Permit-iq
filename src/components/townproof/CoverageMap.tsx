import { MA_SVG_PATH, toSvg } from '../../data/maOutline'
import { TOWN_PROFILES, VERIFIED_TOWN_COUNT } from '../../data/townPermits'

// Lightweight inline-SVG coverage map — no libraries, no runtime cost.
// Verified towns get solid pins; the copy stays honest about the split
// between hand-verified data and AI-researched coverage.
export default function CoverageMap({
  activeSlug,
  onPick,
}: {
  activeSlug?: string
  onPick?: (slug: string) => void
}) {
  return (
    <figure className="select-none">
      <svg
        viewBox="0 0 710 180"
        role="img"
        aria-label={`Map of Massachusetts with ${VERIFIED_TOWN_COUNT} hand-verified towns marked`}
        className="w-full"
      >
        <path
          d={MA_SVG_PATH}
          fill="#dbeafe"
          stroke="#1d4ed8"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {TOWN_PROFILES.map((t) => {
          const [cx, cy] = toSvg(t.map.x, t.map.y)
          const active = t.slug === activeSlug
          return (
            <g
              key={t.slug}
              transform={`translate(${cx}, ${cy})`}
              className={onPick ? 'cursor-pointer' : undefined}
              onClick={() => onPick?.(t.slug)}
            >
              <circle r="11" fill={active ? '#1d4ed8' : 'transparent'} opacity="0.15" />
              <circle
                r="5"
                fill={active ? '#1d4ed8' : '#16a34a'}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <title>{`${t.name} — hand-verified`}</title>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-600 ring-1 ring-white" />
          {VERIFIED_TOWN_COUNT} towns hand-verified against official municipal sources
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-200 ring-1 ring-blue-700/40" />
          All 351 MA cities &amp; towns covered by cited AI research
        </span>
      </figcaption>
    </figure>
  )
}
