import { useLayoutEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroScene from './HeroScene'
import { scrollState } from './scroll'

gsap.registerPlugin(ScrollTrigger)

// Length of the pinned scroll sequence, as a multiple of viewport height.
// Stage 1 covers scene 1 only; grows as later scenes land.
const PIN_LENGTH = '+=300%'

export default function Hero3DSection() {
  const wrap = useRef<HTMLDivElement>(null)
  const headline = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(true)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap.current,
          start: 'top top',
          end: PIN_LENGTH,
          pin: true,
          scrub: 0.4,
          onUpdate(self) {
            scrollState.progress = self.progress
            scrollState.velocity = self.getVelocity()
          },
          // Pause the WebGL frame loop once the pinned section is fully
          // scrolled past (or before it enters, on back-navigation).
          onToggle(self) {
            setActive(self.isActive)
          },
        },
      })
      // 2D overlay choreography, scrubbed on the same timeline (0..1 = progress)
      tl.to(headline.current, { opacity: 0, y: -60, ease: 'none', duration: 0.14 }, 0.02)
      tl.to(hint.current, { opacity: 0, ease: 'none', duration: 0.05 }, 0)
    }, wrap)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={wrap} className="relative h-screen overflow-hidden bg-slate-50">
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 1.75]}
        camera={{ fov: 38, position: [0, 0.55, 9.2] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        className="!absolute inset-0"
      >
        <HeroScene />
      </Canvas>

      {/* 2D overlay */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-24">
        <div ref={headline} className="max-w-3xl px-6 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
            Get your Massachusetts building permit{' '}
            <span className="text-blue-700">right the first time</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-slate-600">
            Describe your project in plain English. PermitIQ maps it to every
            permit your town requires.
          </p>
        </div>
        <div ref={hint} className="flex flex-col items-center gap-2 text-slate-500">
          <span className="text-xs font-medium uppercase tracking-widest">Scroll</span>
          <span className="block h-8 w-px animate-pulse bg-slate-400" />
        </div>
      </div>
    </div>
  )
}
