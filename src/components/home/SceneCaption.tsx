import type { SceneBeat } from '../../data/demoReport'

/**
 * One teaching beat's copy — the "0N / 04" step, a headline, and a sentence.
 * Shared by the 3D scroll overlay and the 2D fallback so the wording is
 * identical in both. `big` is the hero-scale intro variant.
 */
export default function SceneCaption({
  beat,
  big = false,
  className = '',
}: {
  beat: SceneBeat
  big?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-700">
        <span className="tabular-nums">
          {String(beat.n).padStart(2, '0')} / 04
        </span>
        <span className="h-px w-6 bg-blue-200" />
        <span className="text-slate-400">{beat.key}</span>
      </div>
      <h2
        className={`mt-3 font-extrabold tracking-tight text-slate-900 ${
          big ? 'text-4xl sm:text-5xl md:text-6xl' : 'text-3xl sm:text-4xl'
        }`}
      >
        {beat.headline}
      </h2>
      <p
        className={`mx-auto mt-4 text-slate-600 ${
          big ? 'max-w-2xl text-lg sm:text-xl' : 'max-w-xl text-lg'
        }`}
      >
        {beat.body}
      </p>
    </div>
  )
}
