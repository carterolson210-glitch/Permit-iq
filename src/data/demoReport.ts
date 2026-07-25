// Single source of truth for the homepage narrative + demo report.
//
// The 3D scroll overlay, the 2D fallback narrative, and the "sample report"
// affordance all read from here, so the copy and the numbers can never drift
// between them. Every figure below traces to the hand-verified Worcester
// entry in townPermits.ts — nothing here is invented.

import { getTownBySlug, type SourcedFact } from './townPermits'

export const DEMO_TOWN_SLUG = 'worcester-ma'

const town = getTownBySlug(DEMO_TOWN_SLUG)
if (!town) {
  // Fail loud in dev if the demo town is ever renamed/removed upstream.
  throw new Error(`demoReport: demo town "${DEMO_TOWN_SLUG}" not found in TOWN_PROFILES`)
}

export const DEMO_TOWN = town

/**
 * The four teaching beats of the homepage. Each is one plain sentence a
 * person would say out loud, matched to a product capability. Rendered as
 * real DOM text in both the 3D overlay and the 2D fallback.
 */
export type SceneBeat = {
  /** 1-based scene number, for the "01 / 04" step affordance. */
  n: number
  /** Short label for nav / aria. */
  key: string
  headline: string
  body: string
}

export const SCENE_BEATS: SceneBeat[] = [
  {
    n: 1,
    key: 'describe',
    headline: 'You enter an address and describe the work.',
    body: 'Tell PermitIQ what you’re building in plain English — a deck, a finished basement, a new bathroom. No forms, no code numbers.',
  },
  {
    n: 2,
    key: 'rules',
    headline: 'PermitIQ reads it against your town’s own rules.',
    body: 'Not generic state code — the actual bylaws and fee schedule your local building department enforces, town by town.',
  },
  {
    n: 3,
    key: 'report',
    headline: 'You get one packet: every permit, fee, and step.',
    body: 'The permits your project triggers, what each one costs, the review sequence, and the department to file with.',
  },
  {
    n: 4,
    key: 'proof',
    headline: 'Every line traces back to the town’s own source.',
    body: 'Check any figure yourself — each requirement shows the municipal document it came from and the date we verified it.',
  },
]

/** A single line item on the demo report card, carrying its own citation. */
export type ReportLine = {
  label: string
  value: string
  sourceName: string
  sourceUrl: string
  verifiedAt: string
  effectiveDate?: string
}

function toLine(f: SourcedFact): ReportLine {
  return {
    label: f.label,
    value: f.value,
    sourceName: f.sourceName,
    sourceUrl: f.sourceUrl,
    verifiedAt: f.verifiedAt,
    effectiveDate: f.effectiveDate,
  }
}

/**
 * The demo report model — real, sourced Worcester facts. Used by the S4
 * report card (3D) and the 2D fallback. Order is deliberate: the headline
 * fee rule first, then the thresholds a homeowner actually asks about.
 */
export const DEMO_REPORT = {
  townName: DEMO_TOWN.name,
  county: DEMO_TOWN.county,
  dept: DEMO_TOWN.dept,
  portal: DEMO_TOWN.portal,
  lines: DEMO_TOWN.facts.map(toLine),
  penalty: DEMO_TOWN.penalty ? toLine(DEMO_TOWN.penalty) : null,
  /** Number of distinct sourced facts shown — for the "N sourced requirements" affordance. */
  sourcedCount: DEMO_TOWN.facts.length + (DEMO_TOWN.penalty ? 1 : 0),
}
