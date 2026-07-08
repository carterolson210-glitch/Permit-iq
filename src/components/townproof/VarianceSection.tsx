import { motion } from 'framer-motion'
import { VARIANCE_EXAMPLES } from '../../data/townPermits'

// Concrete town-vs-town contrasts computed from the verified fee schedules —
// the "generic tools can't do this" proof, with real numbers.
export default function VarianceSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
          Cross a town line, the rules change
        </h2>
        <p className="mt-3 text-slate-600">
          Real numbers from official municipal fee schedules — the kind of difference a
          generic, national permit tool never shows you.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {VARIANCE_EXAMPLES.map((ex, i) => (
          <motion.div
            key={ex.topic}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-base font-semibold text-slate-900">{ex.topic}</h3>
            <div className="mt-4 space-y-3 flex-1">
              <div className="rounded-lg bg-blue-50 p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  {ex.a.town}
                </div>
                <div className="mt-1 text-sm text-slate-700">{ex.a.fact}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-600">
                  {ex.b.town}
                </div>
                <div className="mt-1 text-sm text-slate-700">{ex.b.fact}</div>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-900">{ex.takeaway}</p>
          </motion.div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">
        Fee figures from each municipality&apos;s published schedule — sources linked in the
        town guides. Always confirm with your building department before filing.
      </p>
    </section>
  )
}
