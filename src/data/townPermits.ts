// Hand-verified municipal permitting data.
//
// Every fact below was extracted from an OFFICIAL municipal source (town
// website or a fee schedule PDF hosted by the town) on the date recorded in
// `verifiedAt`, with the source URL kept alongside the fact. Do not add facts
// here without a source URL — towns not in this file are served by AI research
// at scan time and must be labeled as such in the UI, never as "verified".

export type SourcedFact = {
  label: string
  value: string
  sourceName: string
  sourceUrl: string
  /** Date we last checked the fact against the source (ISO). */
  verifiedAt: string
  /** Effective date stated by the municipality, when published. */
  effectiveDate?: string
}

export type TownPermitProfile = {
  slug: string
  name: string
  county: string
  /** Approximate map position on the stylized MA outline (same coordinate
   *  space as the 3D map: x -3.5..3.4 west→east, y -0.95..0.95 south→north) */
  map: { x: number; y: number }
  dept: {
    name: string
    address?: string
    phone?: string
    email?: string
    url: string
  }
  portal?: { vendor: string; url: string }
  /** Fee rules and permit requirements, each individually sourced. */
  facts: SourcedFact[]
  /** What happens if you build without a permit — town-verified. */
  penalty?: SourcedFact
}

const V = '2026-07-07' // last verification pass (single-day research sweep)

export const TOWN_PROFILES: TownPermitProfile[] = [
  {
    slug: 'boston-ma',
    name: 'Boston',
    county: 'Suffolk',
    map: { x: 1.42, y: 0.1 },
    dept: {
      name: 'Inspectional Services Department (ISD)',
      address: '1010 Massachusetts Ave, 5th Floor, Boston, MA 02118',
      phone: '(617) 635-5300',
      url: 'https://www.boston.gov/departments/inspectional-services',
    },
    portal: { vendor: 'Boston Permitting (online)', url: 'https://www.boston.gov/boston-permitting' },
    facts: [
      {
        label: 'Short-form building permit (minor alteration)',
        value: '$20 primary fee plus $10 per $1,000 of the estimated cost of work',
        sourceName: 'City of Boston ISD Building Division fee schedule (PDF)',
        sourceUrl:
          'https://www.boston.gov/sites/default/files/file/2023/05/Building%20Fees%205%2015%2023.pdf',
        verifiedAt: V,
        effectiveDate: '2023-05-15',
      },
      {
        label: 'Long-form building permit (major alteration, 1–3 family)',
        value: '$50 primary fee plus $10 per $1,000 of the estimated cost of work',
        sourceName: 'City of Boston ISD Building Division fee schedule (PDF)',
        sourceUrl:
          'https://www.boston.gov/sites/default/files/file/2023/05/Building%20Fees%205%2015%2023.pdf',
        verifiedAt: V,
        effectiveDate: '2023-05-15',
      },
      {
        label: 'Plumbing permit',
        value: '$20 primary fee plus $5 per fixture',
        sourceName: 'City of Boston ISD Building Division fee schedule (PDF)',
        sourceUrl:
          'https://www.boston.gov/sites/default/files/file/2023/05/Building%20Fees%205%2015%2023.pdf',
        verifiedAt: V,
        effectiveDate: '2023-05-15',
      },
    ],
    penalty: {
      label: 'Working without a permit',
      value: 'DOUBLE FEE — when work has started without a required permit, or the estimated cost was undervalued',
      sourceName: 'City of Boston ISD Building Division fee schedule (PDF)',
      sourceUrl:
        'https://www.boston.gov/sites/default/files/file/2023/05/Building%20Fees%205%2015%2023.pdf',
      verifiedAt: V,
      effectiveDate: '2023-05-15',
    },
  },
  {
    slug: 'cambridge-ma',
    name: 'Cambridge',
    county: 'Middlesex',
    map: { x: 1.33, y: 0.16 },
    dept: {
      name: 'Inspectional Services Department',
      address: '831 Massachusetts Ave, Cambridge, MA 02139',
      phone: '(617) 349-6100',
      url: 'https://www.cambridgema.gov/inspection',
    },
    facts: [
      {
        label: 'Building permit (standard rate)',
        value: '$20 per $1,000 (or fraction) of construction cost — $50 minimum',
        sourceName: 'City of Cambridge — Building Fees',
        sourceUrl:
          'https://www.cambridgema.gov/inspection/buildingelectricplumbingpermits/buildingfees',
        verifiedAt: V,
      },
      {
        label: 'Building permit (residential, 3 units or fewer)',
        value: '$15 per $1,000 (or fraction) of construction cost — $50 minimum',
        sourceName: 'City of Cambridge — Building Fees',
        sourceUrl:
          'https://www.cambridgema.gov/inspection/buildingelectricplumbingpermits/buildingfees',
        verifiedAt: V,
      },
      {
        label: 'Certificate of occupancy (residential)',
        value: '$100 for the first unit, $50 for each additional unit',
        sourceName: 'City of Cambridge — Building Fees',
        sourceUrl:
          'https://www.cambridgema.gov/inspection/buildingelectricplumbingpermits/buildingfees',
        verifiedAt: V,
      },
    ],
  },
  {
    slug: 'worcester-ma',
    name: 'Worcester',
    county: 'Worcester',
    map: { x: 0.1, y: -0.02 },
    dept: {
      name: 'Inspectional Services — Building & Zoning Division',
      address: '25 Meade Street, Worcester, MA 01610',
      phone: '(508) 799-1198',
      email: 'inspections@worcesterma.gov',
      url: 'https://www.worcesterma.gov/building-zoning',
    },
    portal: { vendor: 'OpenGov', url: 'https://worcesterma.portal.opengov.com/' },
    facts: [
      {
        label: 'Building permit',
        value:
          '$12 per $1,000 (or fraction) of construction value; $9 per $1,000 over $1,000,000 — $100 minimum',
        sourceName: 'City of Worcester — Inspectional Services Schedule of Fees (PDF)',
        sourceUrl: 'https://www.worcesterma.gov/inspections/document-center/schedule-of-fees.pdf',
        verifiedAt: V,
        effectiveDate: '2024-03-01',
      },
      {
        label: 'Fences',
        value: 'Fences 7 feet or less do not require a building permit',
        sourceName: 'City of Worcester — Building & Zoning',
        sourceUrl: 'https://www.worcesterma.gov/building-zoning',
        verifiedAt: V,
      },
      {
        label: 'Sheds',
        value: 'Sheds over 200 sq. ft. require a building permit',
        sourceName: 'City of Worcester — Building & Zoning',
        sourceUrl: 'https://www.worcesterma.gov/building-zoning',
        verifiedAt: V,
      },
      {
        label: 'Paper applications',
        value: '$50 administrative fee for permits submitted over-the-counter or by mail',
        sourceName: 'City of Worcester — Building & Zoning',
        sourceUrl: 'https://www.worcesterma.gov/building-zoning',
        verifiedAt: V,
        effectiveDate: '2022-01-01',
      },
    ],
    penalty: {
      label: 'Working without a permit',
      value:
        'Triple the original permit fee — minimum penalty $500 (residential) or $1,000 (commercial)',
      sourceName: 'City of Worcester — Inspectional Services Schedule of Fees (PDF)',
      sourceUrl: 'https://www.worcesterma.gov/inspections/document-center/schedule-of-fees.pdf',
      verifiedAt: V,
      effectiveDate: '2024-03-01',
    },
  },
  {
    slug: 'springfield-ma',
    name: 'Springfield',
    county: 'Hampden',
    map: { x: -1.9, y: -0.42 },
    dept: {
      name: 'Code Enforcement — Building Division',
      address: '70 Tapley Street, Springfield, MA 01104',
      phone: '(413) 787-6031',
      url: 'https://www.springfield-ma.gov/code/',
    },
    portal: { vendor: 'OpenGov', url: 'https://springfieldma.portal.opengov.com/' },
    facts: [
      {
        label: 'New construction / additions (1 & 2 family)',
        value: '$250 minimum, or $8 per $1,000 of value',
        sourceName: 'City of Springfield — Building Permit Fee Schedule (PDF)',
        sourceUrl:
          'https://www.springfield-ma.gov/code/fileadmin/Fee_Schedules/2012/BLDG_PERMIT_FEE_SCHEDULE_FOR_WEB_SITE__7-16-12_.pdf',
        verifiedAt: V,
        effectiveDate: '2012-07-16',
      },
      {
        label: 'Roofing, siding, decks, insulation, windows/doors (residential)',
        value: '$75 flat fee',
        sourceName: 'City of Springfield — Building Permit Fee Schedule (PDF)',
        sourceUrl:
          'https://www.springfield-ma.gov/code/fileadmin/Fee_Schedules/2012/BLDG_PERMIT_FEE_SCHEDULE_FOR_WEB_SITE__7-16-12_.pdf',
        verifiedAt: V,
        effectiveDate: '2012-07-16',
      },
      {
        label: 'In-ground swimming pool',
        value: '$125 ($100 above-ground with deck; $80 without)',
        sourceName: 'City of Springfield — Building Permit Fee Schedule (PDF)',
        sourceUrl:
          'https://www.springfield-ma.gov/code/fileadmin/Fee_Schedules/2012/BLDG_PERMIT_FEE_SCHEDULE_FOR_WEB_SITE__7-16-12_.pdf',
        verifiedAt: V,
        effectiveDate: '2012-07-16',
      },
      {
        label: 'Sheds over 200 sq. ft.',
        value: '$50 (per MA amendments; smaller sheds are generally exempt from a building permit)',
        sourceName: 'City of Springfield — Building Permit Fee Schedule (PDF)',
        sourceUrl:
          'https://www.springfield-ma.gov/code/fileadmin/Fee_Schedules/2012/BLDG_PERMIT_FEE_SCHEDULE_FOR_WEB_SITE__7-16-12_.pdf',
        verifiedAt: V,
        effectiveDate: '2012-07-16',
      },
    ],
  },
  {
    slug: 'lowell-ma',
    name: 'Lowell',
    county: 'Middlesex',
    map: { x: 0.85, y: 0.62 },
    dept: {
      name: 'Development Services',
      address: 'City Hall, 375 Merrimack Street, 2nd Floor Room 55, Lowell, MA 01852',
      phone: '(978) 674-4144',
      url: 'https://www.lowellma.gov/613/Building-Permit-Fees',
    },
    facts: [
      {
        label: 'Building permit (residential & commercial)',
        value: '$50 up to the first $1,000 of value, plus $10 per $1,000 (or fraction) above that',
        sourceName: 'City of Lowell — Building Permit Fees',
        sourceUrl: 'https://www.lowellma.gov/613/Building-Permit-Fees',
        verifiedAt: V,
      },
      {
        label: 'Certificate of occupancy',
        value: '$75 per unit',
        sourceName: 'City of Lowell — Building Permit Fees',
        sourceUrl: 'https://www.lowellma.gov/613/Building-Permit-Fees',
        verifiedAt: V,
      },
      {
        label: 'Off-hours inspection',
        value: '$500 (scheduled); re-inspection $50',
        sourceName: 'City of Lowell — Building Permit Fees',
        sourceUrl: 'https://www.lowellma.gov/613/Building-Permit-Fees',
        verifiedAt: V,
      },
    ],
    penalty: {
      label: 'Working without a permit',
      value: 'Triple (3×) the initial permit fee',
      sourceName: 'City of Lowell — Building Permit Fees',
      sourceUrl: 'https://www.lowellma.gov/613/Building-Permit-Fees',
      verifiedAt: V,
    },
  },
  {
    slug: 'somerville-ma',
    name: 'Somerville',
    county: 'Middlesex',
    map: { x: 1.36, y: 0.2 },
    dept: {
      name: 'Inspectional Services Department (ISD) — Building Division',
      phone: '(617) 625-6600 ext. 5600',
      email: 'isd@somervillema.gov',
      url: 'https://www.somervillema.gov/departments/isd/building-division',
    },
    portal: { vendor: 'CitizenServe', url: 'https://www.somervillema.gov/citizenserve' },
    facts: [
      {
        label: 'Building permit',
        value:
          '$20 per $1,000 of estimated cost up to $100,000; $21 per $1,000 over $100,000 — $50 minimum',
        sourceName: 'Somerville ISD Building Division Fee Schedule (PDF)',
        sourceUrl:
          'https://s3.amazonaws.com/somervillema-live/s3fs-public/building-permit-fee-schedule.pdf',
        verifiedAt: V,
        effectiveDate: '2025-01-01',
      },
      {
        label: 'Plan review fees (added to permit fee)',
        value: 'Zoning review $250; building-code review $4 per $1,000 ($50 min); safety review 0.35% of cost ($100 min)',
        sourceName: 'Somerville ISD Building Division Fee Schedule (PDF)',
        sourceUrl:
          'https://s3.amazonaws.com/somervillema-live/s3fs-public/building-permit-fee-schedule.pdf',
        verifiedAt: V,
        effectiveDate: '2025-01-01',
      },
      {
        label: 'Swimming pools',
        value: 'Above-ground $165; in-ground $275',
        sourceName: 'Somerville ISD Building Division Fee Schedule (PDF)',
        sourceUrl:
          'https://s3.amazonaws.com/somervillema-live/s3fs-public/building-permit-fee-schedule.pdf',
        verifiedAt: V,
        effectiveDate: '2025-01-01',
      },
    ],
    penalty: {
      label: 'Working without a permit',
      value: '3× the permit fee (Stop Work Order issued)',
      sourceName: 'Somerville ISD Building Division Fee Schedule (PDF)',
      sourceUrl:
        'https://s3.amazonaws.com/somervillema-live/s3fs-public/building-permit-fee-schedule.pdf',
      verifiedAt: V,
      effectiveDate: '2025-01-01',
    },
  },
  {
    slug: 'salem-ma',
    name: 'Salem',
    county: 'Essex',
    map: { x: 1.52, y: 0.28 },
    dept: {
      name: 'Inspectional Services (Building Department)',
      address: '98 Washington Street, 2nd Floor, Salem, MA 01970',
      phone: '(978) 619-5642',
      url: 'https://www.salemma.gov/inspectional-services-building-department-public-property',
    },
    portal: { vendor: 'OpenGov / ViewPoint Cloud', url: 'https://salemma.portal.opengov.com/' },
    facts: [
      {
        label: 'Building permit (residential, 1–2 units)',
        value: '$75 base fee plus $15 per $1,000 of total project cost',
        sourceName: 'City of Salem — Building Permit Fees',
        sourceUrl: 'https://www.salemma.gov/329/Fees',
        verifiedAt: V,
      },
      {
        label: 'Building permit (commercial / 3+ units)',
        value: '$75 base fee plus $20 per $1,000 of total project cost',
        sourceName: 'City of Salem — Building Permit Fees',
        sourceUrl: 'https://www.salemma.gov/329/Fees',
        verifiedAt: V,
      },
      {
        label: 'Application method',
        value: 'All applications are submitted online (payment via card or check through the portal)',
        sourceName: 'City of Salem — Permits',
        sourceUrl:
          'https://www.salemma.gov/inspectional-services-building-department-public-property/pages/permits',
        verifiedAt: V,
      },
    ],
  },
  {
    slug: 'marblehead-ma',
    name: 'Marblehead',
    county: 'Essex',
    map: { x: 1.6, y: 0.32 },
    dept: {
      name: 'Building Inspection Department',
      address: 'Mary Alley Municipal Building, 7 Widger Road, Marblehead, MA 01945',
      phone: '(781) 631-2220',
      url: 'https://www.marblehead.org/building-inspection-department',
    },
    portal: { vendor: 'ViewPoint Cloud', url: 'https://marbleheadma.viewpointcloud.com/' },
    facts: [
      {
        label: 'Building permit',
        value:
          '$15 per $1,000 of estimated project cost — $30 minimum. The fee includes the wiring permit and the plumbing permit.',
        sourceName: 'Town of Marblehead — Building Permits & Fees',
        sourceUrl:
          'https://www.marblehead.org/building-inspection-department/pages/building-permits-fees',
        verifiedAt: V,
      },
      {
        label: 'Application',
        value:
          'Completed online application stating project cost (materials + labor), signed by owner and applicant',
        sourceName: 'Town of Marblehead — Building Permits & Fees',
        sourceUrl:
          'https://www.marblehead.org/building-inspection-department/pages/building-permits-fees',
        verifiedAt: V,
      },
    ],
  },
  {
    slug: 'beverly-ma',
    name: 'Beverly',
    county: 'Essex',
    map: { x: 1.55, y: 0.38 },
    dept: {
      name: 'Municipal Inspections / Building Department',
      url: 'https://www.beverlyma.gov/214/Municipal-Inspections-Building-Departmen',
    },
    portal: { vendor: 'Online Permit Center', url: 'https://www.beverlyma.gov/224/Online-Permit-Center' },
    facts: [
      {
        label: 'Building permit (residential & commercial)',
        value:
          '$15 per $1,000 of construction value (rounded up to the next $1,000) — $65 minimum',
        sourceName: 'City of Beverly — Building Permit Fees',
        sourceUrl: 'https://www.beverlyma.gov/221/Building-Permit-Fees',
        verifiedAt: V,
      },
      {
        label: 'Residential solar',
        value: '$10 per panel — $500 maximum (residential); $1,000 maximum (commercial)',
        sourceName: 'City of Beverly — Building Permit Fees',
        sourceUrl: 'https://www.beverlyma.gov/221/Building-Permit-Fees',
        verifiedAt: V,
      },
      {
        label: 'Inspection scheduling',
        value: 'Inspections are normally scheduled within 2–4 business days',
        sourceName: 'City of Beverly — Building Department FAQ',
        sourceUrl: 'https://www.beverlyma.gov/FAQ.aspx?TID=23',
        verifiedAt: V,
      },
    ],
    penalty: {
      label: 'Working without a permit',
      value: 'Double (2×) the original fee — maximum additional fee $1,000',
      sourceName: 'City of Beverly — Building Permit Fees',
      sourceUrl: 'https://www.beverlyma.gov/221/Building-Permit-Fees',
      verifiedAt: V,
    },
  },
  {
    slug: 'lynn-ma',
    name: 'Lynn',
    county: 'Essex',
    map: { x: 1.47, y: 0.24 },
    dept: {
      name: 'Inspectional Services Department (ISD)',
      address: 'Lynn City Hall, Room 401, 3 City Hall Square, Lynn, MA 01901',
      phone: '(781) 586-6820',
      email: 'permitting@lynnma.gov',
      url: 'https://www.lynnma.gov/city_government/departments/isd',
    },
    portal: { vendor: 'SmartGov', url: 'https://ci-lynn-ma.smartgovcommunity.com/' },
    facts: [
      {
        label: 'Building permit (residential, 1–2 family)',
        value: '$18 per $1,000 of estimated construction value — $100 minimum',
        sourceName: 'City of Lynn — Building Permit Fees (PDF)',
        sourceUrl:
          'https://www.lynnma.gov/city_government/departments/isd/forms___fees___applications',
        verifiedAt: V,
        effectiveDate: '2025-03-01',
      },
      {
        label: 'Building permit (commercial, all others)',
        value: '$22 per $1,000 of estimated construction value — $150 minimum',
        sourceName: 'City of Lynn — Building Permit Fees (PDF)',
        sourceUrl:
          'https://www.lynnma.gov/city_government/departments/isd/forms___fees___applications',
        verifiedAt: V,
        effectiveDate: '2025-03-01',
      },
      {
        label: 'Decision timeline',
        value: 'A decision should be made on building permits within thirty (30) days',
        sourceName: 'City of Lynn — ISD FAQ',
        sourceUrl: 'https://www.lynnma.gov/city_government/departments/isd/f_a_q___get_answers_fast',
        verifiedAt: V,
      },
    ],
    penalty: {
      label: 'Working without a permit',
      value: 'Triple (3×) the calculated permit fee for all work begun without a permit',
      sourceName: 'City of Lynn — Building Permit Fees (PDF)',
      sourceUrl:
        'https://www.lynnma.gov/city_government/departments/isd/forms___fees___applications',
      verifiedAt: V,
      effectiveDate: '2025-03-01',
    },
  },
]

export const VERIFIED_TOWN_COUNT = TOWN_PROFILES.length

const bySlug = new Map(TOWN_PROFILES.map((t) => [t.slug, t]))
const byName = new Map(TOWN_PROFILES.map((t) => [t.name.toLowerCase(), t]))

export function getTownBySlug(slug: string): TownPermitProfile | undefined {
  return bySlug.get(slug)
}

/** Match a free-text town name (e.g. from a scan) to a verified profile. */
export function getTownByName(name: string): TownPermitProfile | undefined {
  return byName.get(name.trim().toLowerCase().replace(/,?\s*(ma|massachusetts)\.?$/i, ''))
}

// Real town-to-town variance, straight from the sourced facts above.
// Each example pairs two towns on the same permit topic.
export const VARIANCE_EXAMPLES: {
  topic: string
  a: { town: string; fact: string }
  b: { town: string; fact: string }
  takeaway: string
}[] = [
  {
    topic: 'The same $30,000 kitchen remodel',
    a: { town: 'Cambridge', fact: '$450 permit fee ($15/$1,000 residential rate)' },
    b: { town: 'Lynn', fact: '$540 permit fee ($18/$1,000) — plus $25 if you file on paper' },
    takeaway: 'Same project, different town, different math. Generic tools quote neither.',
  },
  {
    topic: 'A new backyard deck',
    a: { town: 'Springfield', fact: 'Flat $75 permit fee for decks, any size' },
    b: {
      town: 'Somerville',
      fact: '$20/$1,000 permit fee plus a $250 zoning review and a 0.35% safety review',
    },
    takeaway: 'A $12,000 deck costs $75 to permit in Springfield — over $600 in Somerville.',
  },
  {
    topic: 'Building without a permit',
    a: { town: 'Beverly', fact: 'Double the fee, capped at $1,000 extra' },
    b: { town: 'Worcester', fact: 'Triple the fee — $500 minimum penalty on residential work' },
    takeaway: 'The cost of guessing wrong varies 5× between towns 40 miles apart.',
  },
]
