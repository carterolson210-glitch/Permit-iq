import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroScene from './HeroScene'
import { scrollState } from './scroll'

gsap.registerPlugin(ScrollTrigger)

// Pinned scroll length: 5 viewport-heights of scroll drive the 4-scene
// sequence (document → break-apart → map → dashboard reveal).
const PIN_LENGTH = '+=500%'

export default function Hero3DSection() {
  const wrap = useRef<HTMLDivElement>(null)
  const headline = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLDivElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const dash = useRef<HTMLDivElement>(null)
  const capExtract = useRef<HTMLDivElement>(null)
  const capMap = useRef<HTMLDivElement>(null)
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
          // Pause the WebGL frame loop when the pinned section isn't on screen.
          onToggle(self) {
            setActive(self.isActive)
          },
        },
      })
      // Overlay choreography. tl.set({}, {}, 1) pins timeline duration to 1 so
      // tween positions map 1:1 onto scroll progress.
      tl.to(headline.current, { opacity: 0, y: -60, ease: 'none', duration: 0.06 }, 0.02)
      tl.to(hint.current, { opacity: 0, ease: 'none', duration: 0.03 }, 0)
      // scene captions: extract (S2) and map (S3), each in-hold-out
      tl.fromTo(
        capExtract.current,
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, ease: 'power1.out', duration: 0.05 },
        0.24
      )
      tl.to(capExtract.current, { opacity: 0, y: -30, ease: 'power1.in', duration: 0.05 }, 0.4)
      tl.fromTo(
        capMap.current,
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, ease: 'power1.out', duration: 0.05 },
        0.52
      )
      tl.to(capMap.current, { opacity: 0, y: -30, ease: 'power1.in', duration: 0.05 }, 0.7)
      // S4: soft veil over the 3D scene, then the dashboard card rises
      tl.fromTo(
        veil.current,
        { opacity: 0 },
        { opacity: 1, ease: 'none', duration: 0.12 },
        0.76
      )
      tl.fromTo(
        dash.current,
        { opacity: 0, y: 90, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, ease: 'power1.out', duration: 0.16 },
        0.8
      )
      tl.set({}, {}, 1)
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

      {/* S4 veil — lets the 3D exit softly behind the dashboard */}
      <div
        ref={veil}
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/60 via-slate-50/85 to-slate-50 opacity-0"
      />

      {/* 2D overlay — Framer Motion handles entrances, GSAP handles scroll-out */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-24">
        <div ref={headline} className="max-w-3xl px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900"
          >
            Get your Massachusetts building permit{' '}
            <span className="text-blue-700">right the first time</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="mt-5 text-lg sm:text-xl text-slate-600"
          >
            Describe your project in plain English. PermitIQ maps it to every
            permit your town requires.
          </motion.p>
        </div>
        <motion.div
          ref={hint}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col items-center gap-2 text-slate-500"
        >
          <span className="text-xs font-medium uppercase tracking-widest">Scroll</span>
          <span className="block h-8 w-px animate-pulse bg-slate-400" />
        </motion.div>
      </div>

      {/* scene captions */}
      <div
        ref={capExtract}
        className="pointer-events-none absolute inset-x-0 top-20 flex justify-center opacity-0"
      >
        <div className="max-w-2xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            AI reads your project like an inspector would
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Every requirement — permit type, jurisdiction, timeline, fees —
            extracted in seconds.
          </p>
        </div>
      </div>
      <div
        ref={capMap}
        className="pointer-events-none absolute inset-x-0 top-20 flex justify-center opacity-0"
      >
        <div className="max-w-2xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Tuned to all <span className="text-blue-700">351</span> Massachusetts
            cities &amp; towns
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Local bylaws, local fees, local forms — not generic state guidance.
          </p>
        </div>
      </div>

      {/* S4 dashboard reveal */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
        <div ref={dash} className="w-full max-w-3xl opacity-0">
          <div className="pointer-events-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
              <span className="h-3 w-3 rounded-full bg-slate-300" />
              <span className="h-3 w-3 rounded-full bg-slate-300" />
              <span className="h-3 w-3 rounded-full bg-slate-300" />
              <span className="ml-3 text-sm font-semibold text-slate-700">
                PermitIQ · Deck — Marblehead, MA
              </span>
              <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                Permit Ready
              </span>
            </div>
            <div className="grid gap-6 p-6 sm:grid-cols-5">
              <ul className="space-y-3 sm:col-span-3">
                {[
                  'Building permit — Form PIQ-780',
                  'Zoning compliance review',
                  'Conservation commission (wetlands)',
                  'Certified plot plan + deck framing plan',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 flex-none text-green-600" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="space-y-4 sm:col-span-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estimated fees
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-900">$150–$320</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Timeline
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-900">2–4 weeks</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/analyze"
              className="pointer-events-auto inline-flex items-center rounded-lg bg-blue-700 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-blue-800 transition"
            >
              Scan my project free
            </Link>
            <p className="mt-3 text-sm text-slate-500">
              3 free scans with a new account — no credit card required
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
