import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TOWN_PROFILES, VERIFIED_TOWN_COUNT } from '../data/townPermits'

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function setMeta(title: string, description: string) {
  document.title = title
  let el = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!el) {
    el = document.createElement('meta')
    el.name = 'description'
    document.head.appendChild(el)
  }
  el.content = description
}

export default function HowWeVerify() {
  useEffect(() => {
    setMeta(
      'How PermitIQ verifies Massachusetts permit data',
      `Our methodology: every verified fact is sourced from official municipal websites and fee schedules, with per-town verification dates. ${VERIFIED_TOWN_COUNT} towns hand-verified and growing.`
    )
    return () => {
      document.title = 'PermitIQ'
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-blue-700">
            PermitIQ
          </Link>
          <Link
            to="/analyze"
            className="inline-flex items-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition"
          >
            Start Free
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          How we verify our data
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Permit guidance is only as good as its sources. Here is exactly where ours come
          from — and where the limits are.
        </p>

        <section className="mt-10 space-y-6 text-slate-700 leading-relaxed">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">1. Official sources only</h2>
            <p className="mt-2 text-sm">
              Every fact we label <em>verified</em> was read directly from an official
              municipal source: the town&apos;s own website, its published fee schedule PDF,
              or its codified ordinances. We never mark data verified based on third-party
              aggregators, forums, or AI output.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">2. A citation on every fact</h2>
            <p className="mt-2 text-sm">
              Each verified fact stores the source document&apos;s URL, the date we checked it,
              and — when the town publishes one — the fee schedule&apos;s effective date. You
              can click through to the town&apos;s own document from every town page and every
              report.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">3. Honest labeling everywhere</h2>
            <p className="mt-2 text-sm">
              Massachusetts has 351 municipalities; {VERIFIED_TOWN_COUNT} are hand-verified so
              far (list below). For the rest, our AI researches the town&apos;s current
              requirements at scan time and shows its confidence level and sources — labeled
              as AI-researched, never as verified. When a source is uncertain, reports say
              &ldquo;general Massachusetts guidance&rdquo; instead of inventing a citation.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">4. Re-verification</h2>
            <p className="mt-2 text-sm">
              Fee schedules change. Every verified fact displays its &ldquo;last
              verified&rdquo; date so you can judge freshness yourself, and we re-check
              sources in periodic passes. Some towns publish old schedules (Springfield&apos;s
              current posted schedule dates to 2012; Taunton&apos;s to 2013) — we show the
              town&apos;s stated effective date so that&apos;s visible, not hidden.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="text-lg font-bold text-blue-900">The final authority is your building department</h2>
            <p className="mt-2 text-sm text-blue-900">
              PermitIQ is informational guidance, not legal advice. Always confirm with your
              building department before filing — our reports are built to make that
              conversation fast, by telling you exactly which permits to ask about, what
              documents to bring, and what the town&apos;s published fees say.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">
            {VERIFIED_TOWN_COUNT} hand-verified towns
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Last-verified dates shown per town. Click through for the full sourced guide.
          </p>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Town</th>
                  <th scope="col" className="px-5 py-3">County</th>
                  <th scope="col" className="px-5 py-3">Last verified</th>
                </tr>
              </thead>
              <tbody>
                {[...TOWN_PROFILES]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((t) => (
                    <tr key={t.slug} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-3">
                        <Link to={`/permits/${t.slug}`} className="font-medium text-blue-700 hover:underline">
                          {t.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{t.county}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {formatDate(t.facts[0].verifiedAt)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 rounded-2xl bg-blue-700 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">See it on your own project</h2>
          <p className="mx-auto mt-2 max-w-xl text-blue-100">
            Run a scan and every requirement comes with its source. 3 free scans, no credit
            card.
          </p>
          <Link
            to="/analyze"
            className="mt-5 inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow hover:bg-blue-50 transition"
          >
            Scan my project free
          </Link>
        </section>

        <p className="mt-10 text-xs leading-relaxed text-slate-400">
          PermitIQ provides informational guidance only, drawn from publicly available
          municipal sources as of the verification dates shown. Not legal advice. See our{' '}
          <Link to="/terms" className="underline hover:text-blue-700">terms</Link>.
        </p>
      </main>
    </div>
  )
}
