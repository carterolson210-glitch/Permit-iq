import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroScene from './HeroScene'
import { scrollState } from './scroll'
import { SCENE_BEATS } from '../../data/demoReport'
import DemoReportCard from '../home/DemoReportCard'
import SceneCaption from '../home/SceneCaption'

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

      {/* 2D overlay — Framer Motion handles entrances, GSAP handles scroll-out.
          The real page <h1> and the primary CTA live in the Landing hero above
          this pinned explainer; here we teach the four beats in sync with the
          3D. All copy is real DOM text, driven from SCENE_BEATS. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-24">
        <div ref={headline} className="max-w-3xl px-6 text-center">
          <SceneCaption beat={SCENE_BEATS[0]} big />
        </div>
        <motion.div
          ref={hint}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col items-center gap-2 text-slate-500"
        >
          <span className="text-xs font-medium uppercase tracking-widest">
            Scroll to watch a scan
          </span>
          <span className="block h-8 w-px animate-pulse bg-slate-400" />
        </motion.div>
      </div>

      {/* scene captions (S2 rules · S3 report) */}
      <div
        ref={capExtract}
        className="pointer-events-none absolute inset-x-0 top-20 flex justify-center opacity-0"
      >
        <div className="max-w-2xl px-6 text-center">
          <SceneCaption beat={SCENE_BEATS[1]} />
        </div>
      </div>
      <div
        ref={capMap}
        className="pointer-events-none absolute inset-x-0 top-20 flex justify-center opacity-0"
      >
        <div className="max-w-2xl px-6 text-center">
          <SceneCaption beat={SCENE_BEATS[2]} />
        </div>
      </div>

      {/* S4 report reveal — beat 4 (proof) + the real, sourced Worcester card */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
        <div ref={dash} className="w-full max-w-2xl opacity-0">
          <div className="mb-5 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {SCENE_BEATS[3].headline}
            </h2>
          </div>
          <DemoReportCard className="pointer-events-auto" />
          <div className="mt-6 text-center">
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
