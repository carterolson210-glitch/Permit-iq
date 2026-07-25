import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { SCENE_BEATS } from '../../data/demoReport'
import SceneCaption from './SceneCaption'
import DemoReportCard from './DemoReportCard'

/**
 * The mobile / reduced-motion / no-WebGL path. Delivers the *same* four beats
 * and the *same* sourced report card as the 3D scroll experience — just as
 * scannable, no scroll-hijacking. Under `prefers-reduced-motion: reduce`
 * Framer Motion holds every element visible (MotionConfig in App), so the
 * copy is fully present without animation.
 */
export default function SceneNarrative2D() {
  return (
    <section aria-label="How PermitIQ works" className="bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="space-y-14 sm:space-y-16">
          {/* Beats 1–3: describe → rules → report */}
          {SCENE_BEATS.slice(0, 3).map((beat, i) => (
            <motion.div
              key={beat.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="text-center"
            >
              <SceneCaption beat={beat} />
            </motion.div>
          ))}

          {/* Beat 4 (proof) + the real report card */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45 }}
          >
            <div className="mx-auto max-w-2xl text-center">
              <SceneCaption beat={SCENE_BEATS[3]} />
            </div>
            <DemoReportCard className="mx-auto mt-8 max-w-2xl" />
            <div className="mt-8 text-center">
              <Link
                to="/analyze"
                className="inline-flex items-center rounded-lg bg-blue-700 px-8 py-3.5 text-base font-semibold text-white shadow hover:bg-blue-800 transition"
              >
                Scan my project free
              </Link>
              <p className="mt-3 text-sm text-slate-500">
                3 free scans with a new account — no credit card required
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
