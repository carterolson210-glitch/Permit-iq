import { lazy, Suspense, useMemo } from 'react'
import { SCENE_BEATS } from '../../data/demoReport'

const Hero3DSection = lazy(() => import('./Hero3DSection'))

function canUseWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

export function use3DHero(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    if (window.innerWidth < 768) return false
    return canUseWebGL()
  }, [])
}

// Placeholder shown while the three.js chunk streams in. The real <h1> and
// CTA already live in the hero above this section, so this is just a quiet,
// correctly-sized stand-in for the pinned explainer — no stale headline, no
// layout jump when the canvas takes over. It shows the first beat's copy so
// the section reads as intentional even before WebGL paints.
function HeroLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="max-w-xl px-6 text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-blue-700">
          {SCENE_BEATS[0].headline.replace(/\.$/, '')}
        </div>
        <div
          className="mx-auto mt-6 h-1 w-24 overflow-hidden rounded-full bg-slate-200"
          role="status"
          aria-label="Loading the interactive walkthrough"
        >
          <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
        </div>
      </div>
    </div>
  )
}

export default function Hero3D() {
  return (
    <Suspense fallback={<HeroLoading />}>
      <Hero3DSection />
    </Suspense>
  )
}
