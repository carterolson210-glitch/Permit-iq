import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { VERIFIED_TOWN_COUNT } from '../../data/townPermits'
import { DEMO_TOWN_SLUG } from '../../data/demoReport'

function CheckDot() {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 flex-none text-green-600" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Literal breakdown of what a PermitIQ report contains. */
export function WhatYouGet() {
  const items: { title: string; body: string }[] = [
    {
      title: 'Every permit your project triggers',
      body: 'Building, electrical, plumbing, mechanical, zoning review, conservation — mapped to your specific project, not a generic list.',
    },
    {
      title: 'The forms and where to file them',
      body: 'The exact application to submit, the department that issues it, and the online portal or counter you file at.',
    },
    {
      title: 'Real fees from the town’s schedule',
      body: `The actual fee rule your town charges — hand-verified against ${VERIFIED_TOWN_COUNT} towns’ own fee schedules, cited AI research everywhere else.`,
    },
    {
      title: 'Review timeline and inspection order',
      body: 'What to expect for approval, and the sequence of inspections from footing to final so nothing gets built out of order.',
    },
    {
      title: 'Department contacts',
      body: 'The office name, phone, and address to call when you have a question — no hunting through a town website.',
    },
    {
      title: 'A source link on every requirement',
      body: 'Each figure links back to the municipal document it came from, with the date we verified it. Check any of it yourself.',
    },
  ]
  return (
    <section id="what-you-get" className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">What’s in a report</h2>
          <p className="mt-3 text-slate-600">
            One packet with everything you need to file — specific to your project and your town.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <CheckDot />
                <div>
                  <h3 className="font-semibold text-slate-900">{it.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{it.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to={`/permits/${DEMO_TOWN_SLUG}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline"
          >
            See a sample report for Worcester
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

/** Who it's for — the specific pain each audience feels. */
export function WhoItsFor() {
  const roles: { who: string; pain: string }[] = [
    {
      who: 'General contractors',
      pain: 'Stop losing days to rejected applications and re-submittals. Walk into the building department with the exact packet — every permit, fee, and form — already in hand.',
    },
    {
      who: 'Homeowners & DIYers',
      pain: 'Find out what your town actually requires before you start, what it costs, and what the penalty is for skipping the permit — in plain English, not code sections.',
    },
    {
      who: 'Architects & designers',
      pain: 'Hand clients a clear permit path for any Massachusetts town without re-researching each jurisdiction’s bylaws and fees from scratch.',
    },
  ]
  return (
    <section id="who-its-for" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Who it’s for</h2>
          <p className="mt-3 text-slate-600">
            If your project needs a Massachusetts permit, PermitIQ saves you the guesswork.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {roles.map((r, i) => (
            <motion.div
              key={r.who}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-blue-700">{r.who}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{r.pain}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Is this legal advice?',
    a: 'No. PermitIQ is informational guidance built from public municipal sources. Your local building department is always the final authority — our reports are designed to make that conversation fast and specific.',
  },
  {
    q: 'How current is the data?',
    a: `We hand-verify ${VERIFIED_TOWN_COUNT} Massachusetts towns against their own published fee schedules, and show the source and verification date on every fact. For all other towns, our AI researches the town’s current requirements at scan time and cites its sources so you can confirm each item.`,
  },
  {
    q: 'What if my town isn’t one of the verified ones?',
    a: 'All 351 Massachusetts cities and towns are covered. Verified towns show a badge and a source date; the rest are covered by cited AI research, clearly labeled as such so you always know which is which.',
  },
  {
    q: 'Do you cover states other than Massachusetts?',
    a: 'Not yet. PermitIQ is Massachusetts-only by design — the value is depth in one state’s 351 municipalities, not shallow coverage of fifty.',
  },
]

/** Short FAQ answering the real objections. */
export function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20">
        <h2 className="text-center text-3xl sm:text-4xl font-bold text-slate-900">
          Common questions
        </h2>
        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {FAQS.map((faq, i) => (
            <div key={faq.q}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                {faq.q}
                <span aria-hidden="true" className="text-slate-400">
                  {open === i ? '−' : '+'}
                </span>
              </button>
              {open === i && (
                <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
