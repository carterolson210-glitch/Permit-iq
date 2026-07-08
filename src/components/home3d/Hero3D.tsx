import { lazy, Suspense, useMemo } from 'react'

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

// Lightweight placeholder shown while the three.js chunk streams in — the
// headline is real content, so first paint isn't blocked or blank.
function HeroLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="max-w-3xl px-6 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
          Get your Massachusetts building permit{' '}
          <span className="text-blue-700">right the first time</span>
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-slate-600">
          Describe your project in plain English. PermitIQ maps it to every
          permit your town requires.
        </p>
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
