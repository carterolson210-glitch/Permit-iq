import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  TOWN_PROFILES,
  getTownBySlug,
  VERIFIED_TOWN_COUNT,
  type TownPermitProfile,
} from '../data/townPermits'
import { MA_TOWNS } from '../data/towns'
import CoverageMap from '../components/townproof/CoverageMap'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { logClientError } from '../lib/monitor'

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

function setRobots(content: string | null) {
  const el = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
  if (content === null) {
    el?.remove()
    return
  }
  const tag = el ?? document.head.appendChild(document.createElement('meta'))
  tag.name = 'robots'
  tag.content = content
}

function setCanonical(path: string | null) {
  const el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (path === null) {
    el?.remove()
    return
  }
  const tag = el ?? document.head.appendChild(document.createElement('link'))
  tag.rel = 'canonical'
  tag.href = `${window.location.origin}${path}`
}

/** FAQPage structured data from this town's own hand-verified facts —
 *  real content, not boilerplate, so only rendered for verified towns. */
function townFaqJsonLd(profile: TownPermitProfile) {
  const questions = profile.facts.slice(0, 6).map((f) => ({
    '@type': 'Question',
    name: `${f.label} in ${profile.name}, MA — how much is it?`,
    acceptedAnswer: {
      '@type': 'Answer',
      text: `${f.value} Verified against ${profile.dept.name} on ${formatDate(f.verifiedAt)}. Source: ${f.sourceUrl}`,
    },
  }))
  if (profile.penalty) {
    questions.push({
      '@type': 'Question',
      name: `What happens if you build without a permit in ${profile.name}, MA?`,
      acceptedAnswer: { '@type': 'Answer', text: profile.penalty.value },
    })
  }
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: questions }
}

/** Turn an arbitrary /permits/:slug into a display name if it's a real MA town. */
function townNameFromSlug(slug: string): string | undefined {
  const base = slug.replace(/-ma$/, '').replace(/-/g, ' ').toLowerCase()
  return MA_TOWNS.find((t) => t.toLowerCase() === base)
}

export default function TownPermitPage() {
  const { slug = '' } = useParams()
  const profile = getTownBySlug(slug)
  const fallbackName = profile ? undefined : townNameFromSlug(slug)
  const name = profile?.name ?? fallbackName

  useEffect(() => {
    let script: HTMLScriptElement | null = null

    if (profile) {
      setMeta(
        `${profile.name}, MA Building Permits — Fees, Forms & Contacts | PermitIQ`,
        `${profile.name} building permit fees and requirements, verified against official ${profile.name} municipal sources: ${profile.facts[0].value}. Get a town-specific permit checklist in seconds.`
      )
      // Real, sourced facts — safe and useful to index.
      setRobots('index,follow')
      script = document.head.appendChild(document.createElement('script'))
      script.type = 'application/ld+json'
      script.text = JSON.stringify(townFaqJsonLd(profile))
    } else if (name) {
      setMeta(
        `${name}, MA Building Permits — Coming Soon | PermitIQ`,
        `PermitIQ hasn't hand-verified ${name}'s fee schedule yet. Get notified when it's ready, or scan your ${name} project now for AI-researched, cited guidance.`
      )
      // Near-identical boilerplate across 300+ unverified towns would read
      // as thin/doorway content to search engines — keep these out of the
      // index until they're hand-verified, per the trust-first positioning
      // this whole product is built on.
      setRobots('noindex,follow')
    } else {
      setMeta('Town not found | PermitIQ', 'That is not a Massachusetts city or town PermitIQ recognizes.')
      setRobots('noindex,follow')
    }
    setCanonical(name ? `/permits/${slug}` : null)

    return () => {
      document.title = 'PermitIQ'
      setRobots(null)
      setCanonical(null)
      script?.remove()
    }
  }, [profile, name, slug])

  if (!name) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Town not found</h1>
          <p className="mt-3 text-slate-600">
            We couldn&apos;t find that Massachusetts town. Try the town picker on the
            homepage.
          </p>
          <Link to="/" className="mt-6 inline-block text-blue-700 hover:underline">
            ← Back to PermitIQ
          </Link>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
        <nav className="text-xs text-slate-400">
          <Link to="/" className="hover:text-blue-700">
            PermitIQ
          </Link>{' '}
          / <span>Massachusetts</span> / <span className="text-slate-600">{name}</span>
        </nav>

        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Building permits in {name}, Massachusetts
        </h1>

        {profile ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                ✓ Hand-verified against official {name} sources —{' '}
                {formatDate(profile.facts[0].verifiedAt)}
              </span>
              <Link
                to="/how-we-verify"
                className="text-xs text-blue-700 underline hover:text-blue-800"
              >
                How we verify our data
              </Link>
            </div>

            {/* department card */}
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">{profile.dept.name}</h2>
              <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                {profile.dept.address && (
                  <div>
                    <dt className="font-semibold text-slate-500">Address</dt>
                    <dd className="text-slate-800">{profile.dept.address}</dd>
                  </div>
                )}
                {profile.dept.phone && (
                  <div>
                    <dt className="font-semibold text-slate-500">Phone</dt>
                    <dd className="text-slate-800">{profile.dept.phone}</dd>
                  </div>
                )}
                {profile.dept.email && (
                  <div>
                    <dt className="font-semibold text-slate-500">Email</dt>
                    <dd className="text-slate-800">{profile.dept.email}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-semibold text-slate-500">Official site</dt>
                  <dd>
                    <a
                      href={profile.dept.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      {new URL(profile.dept.url).hostname}
                    </a>
                  </dd>
                </div>
                {profile.portal && (
                  <div>
                    <dt className="font-semibold text-slate-500">Online permitting</dt>
                    <dd>
                      <a
                        href={profile.portal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline"
                      >
                        {profile.portal.vendor}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* facts */}
            <section className="mt-8">
              <h2 className="text-xl font-bold text-slate-900">
                Fees &amp; requirements ({name})
              </h2>
              <ul className="mt-4 space-y-4">
                {profile.facts.map((f) => (
                  <li
                    key={f.label}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <div className="text-sm font-bold text-slate-900">{f.label}</div>
                    <div className="mt-1 text-slate-700">{f.value}</div>
                    <div className="mt-2 text-xs text-slate-400">
                      Source:{' '}
                      <a
                        href={f.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline"
                      >
                        {f.sourceName}
                      </a>
                      {f.effectiveDate && <> · town schedule effective {formatDate(f.effectiveDate)}</>}
                      {' · verified '}
                      {formatDate(f.verifiedAt)}
                    </div>
                  </li>
                ))}
                {profile.penalty && (
                  <li className="rounded-xl border border-red-200 bg-red-50 p-5">
                    <div className="text-sm font-bold text-red-700">
                      {profile.penalty.label}
                    </div>
                    <div className="mt-1 text-slate-800">{profile.penalty.value}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      Source:{' '}
                      <a
                        href={profile.penalty.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline"
                      >
                        {profile.penalty.sourceName}
                      </a>
                    </div>
                  </li>
                )}
              </ul>
            </section>
          </>
        ) : (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-900">
              {name}&apos;s hand-verified permit guide is coming soon
            </h2>
            <p className="mt-2 text-slate-700">
              {name} is one of the 351 Massachusetts cities and towns PermitIQ covers, but
              we only call a town&apos;s fee schedule &ldquo;verified&rdquo; after checking
              it against the town&apos;s own published sources — we haven&apos;t gotten to{' '}
              {name} yet.
            </p>
            <ComingSoonCapture town={name} slug={slug} />
            <p className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
              Don&apos;t want to wait?{' '}
              <Link to="/analyze" className="font-semibold text-blue-700 hover:underline">
                Scan your {name} project now
              </Link>{' '}
              — our AI researches {name}&apos;s current requirements and cites its
              sources, labeled clearly as AI-researched rather than hand-verified.
            </p>
          </section>
        )}

        {/* CTA */}
        <section className="mt-10 rounded-2xl bg-blue-700 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">
            What permits does <em className="not-italic underline decoration-blue-300">your</em>{' '}
            {name} project need?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-blue-100">
            Describe the project in plain English — get the town-specific checklist,
            fees, and contacts in about a minute. 3 free scans, no credit card.
          </p>
          <Link
            to="/analyze"
            className="mt-5 inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow hover:bg-blue-50 transition"
          >
            Scan my {name} project free
          </Link>
        </section>

        {/* other towns */}
        <section className="mt-12">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              {VERIFIED_TOWN_COUNT} hand-verified town guides
            </h2>
            <Link to="/coverage" className="text-xs font-medium text-blue-700 hover:underline">
              See full coverage map →
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TOWN_PROFILES.filter((t) => t.slug !== slug).map((t) => (
              <Link
                key={t.slug}
                to={`/permits/${t.slug}`}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition"
              >
                {t.name}
              </Link>
            ))}
          </div>
          <div className="mt-8 max-w-xl">
            <CoverageMap activeSlug={slug} />
          </div>
        </section>

        <p className="mt-12 text-xs leading-relaxed text-slate-400">
          PermitIQ provides informational guidance only, drawn from publicly available
          municipal sources as of the verification dates shown. Fee schedules change;
          always confirm requirements and amounts with the {name} building department
          before filing. Not legal advice.
        </p>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
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
      {children}
    </div>
  )
}

/** Email capture shown instead of thin AI-only content on unverified town
 *  pages, tagged per-town so a future notify-on-verification pass can
 *  target exactly the people who asked about that town. */
function ComingSoonCapture({ town, slug }: { town: string; slug: string }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setState('error')
      return
    }
    setState('saving')
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('email_subscribers')
          .insert({ email: trimmed, source: `town_coming_soon:${slug}` })
      }
      setState('done')
    } catch (err) {
      logClientError('town_notify_signup_failed', err)
      setState('done')
    }
  }

  if (state === 'done') {
    return (
      <p className="mt-4 text-sm font-medium text-green-700">
        You&apos;re on the list — we&apos;ll email you when {town} is verified.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <label htmlFor="notify-email" className="sr-only">
          Email address
        </label>
        <input
          id="notify-email"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state === 'error') setState('idle')
          }}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/30"
        />
        {state === 'error' && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            Please enter a valid email address.
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={state === 'saving'}
        className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60"
      >
        {state === 'saving' ? 'Saving…' : `Notify me about ${town}`}
      </button>
    </form>
  )
}
