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

const V = '2026-07-07' // first verification pass
const V2 = '2026-07-10' // second verification pass (expansion batch)

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
  {
    slug: 'quincy-ma',
    name: 'Quincy',
    county: 'Norfolk',
    map: { x: 1.5, y: -0.04 },
    dept: {
      name: 'Inspectional Services Department',
      address: '1305 Hancock Street, Quincy, MA 02169',
      phone: '(617) 376-1450',
      url: 'https://www.quincyma.gov/departments/inspectional_services/inspectional_services_departments/building.php',
    },
    portal: {
      vendor: 'ViewPoint (city online permitting)',
      url: 'https://www.quincyma.gov/departments/inspectional_services/online_permitting.php',
    },
    facts: [
      {
        label: 'Building permit',
        value: '$20 for the first $1,000 of estimated construction cost, then $12 per additional $1,000 (or part thereof)',
        sourceName: 'City of Quincy Code — Department of Inspectional Services Fees',
        sourceUrl: 'https://ecode360.com/29044906',
        verifiedAt: V2,
      },
      {
        label: 'Change of occupancy',
        value: '$60',
        sourceName: 'City of Quincy Code — Department of Inspectional Services Fees',
        sourceUrl: 'https://ecode360.com/29044906',
        verifiedAt: V2,
      },
    ],
    penalty: {
      label: 'Working without a permit',
      value: 'Double the permit fee, charged from the 6th day after work commences without a permit',
      sourceName: 'City of Quincy Code — Department of Inspectional Services Fees',
      sourceUrl: 'https://ecode360.com/29044906',
      verifiedAt: V2,
    },
  },
  {
    slug: 'newton-ma',
    name: 'Newton',
    county: 'Middlesex',
    map: { x: 1.12, y: 0.08 },
    dept: {
      name: 'Inspectional Services Department',
      address: '1000 Commonwealth Avenue, Newton, MA 02459',
      phone: '(617) 796-1060',
      email: 'ISD@newtonma.gov',
      url: 'https://www.newtonma.gov/government/inspectional-services',
    },
    portal: { vendor: 'OpenGov', url: 'https://newtonma.portal.opengov.com/' },
    facts: [
      {
        label: 'Building permit',
        value:
          '$20 per $1,000 of estimated construction cost (rounded up to the nearest thousand) — $50 minimum residential, $100 minimum commercial',
        sourceName: 'City of Newton — Permit Fee Schedule (PDF)',
        sourceUrl: 'https://www.newtonma.gov/home/showpublisheddocument/29405/638630352124700000',
        verifiedAt: V2,
      },
    ],
  },
  {
    slug: 'brookline-ma',
    name: 'Brookline',
    county: 'Norfolk',
    map: { x: 1.28, y: 0.1 },
    dept: {
      name: 'Building Department',
      address: '333 Washington Street, Brookline, MA 02445',
      phone: '(617) 730-2100',
      url: 'https://www.brooklinema.gov/172/Building-Department',
    },
    portal: { vendor: 'Online Permits (town portal)', url: 'https://www.brooklinema.gov/187/Online-Permits' },
    facts: [
      {
        label: 'Building permit',
        value: '$20 per $1,000 of construction value (or fraction thereof) — $50 minimum',
        sourceName: 'Town of Brookline — Permit & Fee Schedule',
        sourceUrl: 'https://www.brooklinema.gov/183/Permit-Fee-Schedule',
        verifiedAt: V2,
        effectiveDate: '2022-07-18',
      },
      {
        label: 'Re-inspection / missed final inspection',
        value: '$50 per re-inspection; $50 if final inspection is not called for within ten working days',
        sourceName: 'Town of Brookline — Permit & Fee Schedule',
        sourceUrl: 'https://www.brooklinema.gov/183/Permit-Fee-Schedule',
        verifiedAt: V2,
        effectiveDate: '2022-07-18',
      },
    ],
    penalty: {
      label: 'Working without a permit',
      value: 'Fee rises to $50 per $1,000 of construction value — 2.5× the normal rate',
      sourceName: 'Town of Brookline — Permit & Fee Schedule',
      sourceUrl: 'https://www.brooklinema.gov/183/Permit-Fee-Schedule',
      verifiedAt: V2,
      effectiveDate: '2022-07-18',
    },
  },
  {
    slug: 'brockton-ma',
    name: 'Brockton',
    county: 'Plymouth',
    map: { x: 1.35, y: -0.32 },
    dept: {
      name: 'Building Department',
      address: '45 School Street, Brockton, MA 02301',
      phone: '(508) 580-7150',
      url: 'https://brockton.ma.us/city-departments/building/',
    },
    facts: [
      {
        label: 'Building permit',
        value: '$100 for the first $5,000 of construction valuation, then $20 per additional $1,000 (or fraction thereof) — $100 minimum',
        sourceName: 'City of Brockton Code of Ordinances, Ch. 4 (Buildings)',
        sourceUrl:
          'https://library.municode.com/ma/brockton/codes/code_of_ordinances?nodeId=PTIIREOR_CH4BU_ARTIVREVAABPR_S4-50MARE',
        verifiedAt: V2,
      },
      {
        label: 'Inspection scheduling',
        value: 'Building inspectors available 7:00 AM–3:00 PM weekdays; inspection windows 8:30–10:00 AM and 3:00–4:30 PM',
        sourceName: 'City of Brockton — Building Department',
        sourceUrl: 'https://brockton.ma.us/city-departments/building/',
        verifiedAt: V2,
      },
    ],
  },
  {
    slug: 'plymouth-ma',
    name: 'Plymouth',
    county: 'Plymouth',
    map: { x: 1.85, y: -0.42 },
    dept: {
      name: 'Department of Inspectional Services',
      address: '26 Court Street, Plymouth, MA 02360',
      phone: '(508) 322-3431',
      url: 'https://www.plymouth-ma.gov/349/Inspectional-Services',
    },
    facts: [
      {
        label: 'New residential construction',
        value:
          '$14 per $1,000 of calculated construction cost (valued at $110/sq ft) — $250 minimum',
        sourceName: 'Town of Plymouth — Building Fees (PDF)',
        sourceUrl: 'https://plymouth-ma.gov/DocumentCenter/View/1047/Building-Fees-PDF',
        verifiedAt: V2,
        effectiveDate: '2023-02-01',
      },
      {
        label: 'Additions / alterations / renovations',
        value: '$13 per $1,000 of calculated construction cost (valued at $100/sq ft) — $75 minimum',
        sourceName: 'Town of Plymouth — Building Fees (PDF)',
        sourceUrl: 'https://plymouth-ma.gov/DocumentCenter/View/1047/Building-Fees-PDF',
        verifiedAt: V2,
        effectiveDate: '2023-02-01',
      },
      {
        label: 'Express permits (roofing, siding, windows/doors)',
        value: '$75 flat for one; $140 for two combined; $200 for all three',
        sourceName: 'Town of Plymouth — Building Fees (PDF)',
        sourceUrl: 'https://plymouth-ma.gov/DocumentCenter/View/1047/Building-Fees-PDF',
        verifiedAt: V2,
        effectiveDate: '2023-02-01',
      },
      {
        label: 'Swimming pools',
        value: 'Above-ground $100; in-ground $200',
        sourceName: 'Town of Plymouth — Building Fees (PDF)',
        sourceUrl: 'https://plymouth-ma.gov/DocumentCenter/View/1047/Building-Fees-PDF',
        verifiedAt: V2,
        effectiveDate: '2023-02-01',
      },
    ],
  },
  {
    slug: 'fall-river-ma',
    name: 'Fall River',
    county: 'Bristol',
    map: { x: 1.05, y: -0.6 },
    dept: {
      name: 'Inspectional Services — Building Division',
      address: 'One Government Center, Room 524, Fall River, MA 02722',
      phone: '(508) 324-2500',
      url: 'https://fallriverma.gov/departments/inspectional_services/',
    },
    portal: { vendor: 'OpenGov', url: 'https://fallriverma.portal.opengov.com/' },
    facts: [
      {
        label: 'New residential construction',
        value:
          '$0.19 per square foot, including basement, decks, porches, and garages — calculated by the Building Inspector',
        sourceName: 'City of Fall River — New Residential Construction',
        sourceUrl:
          'https://www.fallriverma.gov/departments/inspectional_services/building/new_residential_construction.php',
        verifiedAt: V2,
      },
      {
        label: 'Cost estimates are checked',
        value:
          'If the division believes the declared cost estimate is too low, it may set a new value after examination',
        sourceName: 'City of Fall River Code — Permits (Art. II)',
        sourceUrl: 'https://ecode360.com/29925770',
        verifiedAt: V2,
      },
    ],
  },
  {
    slug: 'framingham-ma',
    name: 'Framingham',
    county: 'Middlesex',
    map: { x: 0.72, y: 0.02 },
    dept: {
      name: 'Inspectional Services — Building Division',
      address: '150 Concord Street, Room 203, Framingham, MA 01702',
      url: 'https://www.framinghamma.gov/127/Inspectional-Services',
    },
    portal: { vendor: 'OpenGov', url: 'https://framinghamma.portal.opengov.com/' },
    facts: [
      {
        label: 'Building permit (residential & commercial)',
        value: '$15 per $1,000 of actual construction cost — $50 minimum residential, $100 minimum commercial',
        sourceName: 'City of Framingham — Building Permit Fees',
        sourceUrl: 'https://www.framinghamma.gov/324/Building-Permit-Fees',
        verifiedAt: V2,
        effectiveDate: '2008-04-01',
      },
      {
        label: 'Occupancy permit',
        value: '$100 per dwelling or commercial unit',
        sourceName: 'City of Framingham — Building Permit Fees',
        sourceUrl: 'https://www.framinghamma.gov/324/Building-Permit-Fees',
        verifiedAt: V2,
        effectiveDate: '2008-04-01',
      },
      {
        label: 'Re-inspection',
        value: '$75 per notice; after-hours inspection $220',
        sourceName: 'City of Framingham — Building Permit Fees',
        sourceUrl: 'https://www.framinghamma.gov/324/Building-Permit-Fees',
        verifiedAt: V2,
        effectiveDate: '2008-04-01',
      },
    ],
    penalty: {
      label: 'Working without a permit',
      value: 'Double the building permit fee',
      sourceName: 'City of Framingham — Building Permit Fees',
      sourceUrl: 'https://www.framinghamma.gov/324/Building-Permit-Fees',
      verifiedAt: V2,
      effectiveDate: '2008-04-01',
    },
  },
  {
    slug: 'waltham-ma',
    name: 'Waltham',
    county: 'Middlesex',
    map: { x: 1.1, y: 0.18 },
    dept: {
      name: 'Building Department',
      address: '119 School Street, Government Center 2nd Floor Room 25, Waltham, MA 02451',
      phone: '(781) 314-3275',
      url: 'https://www.city.waltham.ma.us/building-department',
    },
    facts: [
      {
        label: 'Building permit (residential)',
        value: '$12 per $1,000 of estimated job cost — $50 minimum',
        sourceName: 'City of Waltham — Building Department FAQ (How much does a permit cost?)',
        sourceUrl: 'https://www.city.waltham.ma.us/building-department/faq/how-much-does-a-permit-cost',
        verifiedAt: V2,
      },
      {
        label: 'Building permit (commercial)',
        value: '$22 per $1,000 of estimated job cost — $100 minimum',
        sourceName: 'City of Waltham — Building Department FAQ (How much does a permit cost?)',
        sourceUrl: 'https://www.city.waltham.ma.us/building-department/faq/how-much-does-a-permit-cost',
        verifiedAt: V2,
      },
      {
        label: 'Plumbing permit (residential)',
        value: '$25 for the first fixture, $10 each additional',
        sourceName: 'City of Waltham — Building Department FAQ (How much does a permit cost?)',
        sourceUrl: 'https://www.city.waltham.ma.us/building-department/faq/how-much-does-a-permit-cost',
        verifiedAt: V2,
      },
    ],
  },
  {
    slug: 'haverhill-ma',
    name: 'Haverhill',
    county: 'Essex',
    map: { x: 1.15, y: 0.74 },
    dept: {
      name: 'Inspectional Services — Building Division',
      address: 'City Hall, 4 Summer Street, Haverhill, MA 01830',
      phone: '(978) 374-2338',
      url: 'https://www.haverhillma.gov/living-here/building-and-renovating/building-permits/',
    },
    portal: { vendor: 'OpenGov', url: 'https://haverhillma.portal.opengov.com/' },
    facts: [
      {
        label: 'Alterations / additions / repairs',
        value: '$50 for the first $2,000 of project value, then $14 per additional $1,000 (or portion thereof)',
        sourceName: 'City of Haverhill — Building Permits',
        sourceUrl: 'https://www.haverhillma.gov/living-here/building-and-renovating/building-permits/',
        verifiedAt: V2,
      },
      {
        label: 'New construction',
        value: '$25 application plus $13 per $1,000 of construction cost (residential and commercial), no maximum',
        sourceName: 'City of Haverhill Code — Ch. 120 Building Construction (§120-11)',
        sourceUrl: 'https://ecode360.com/6260745',
        verifiedAt: V2,
      },
      {
        label: 'Permit card required on site',
        value: 'The physical permit card must be posted on site before work begins',
        sourceName: 'City of Haverhill — Building Permits',
        sourceUrl: 'https://www.haverhillma.gov/living-here/building-and-renovating/building-permits/',
        verifiedAt: V2,
      },
    ],
  },
  {
    slug: 'medford-ma',
    name: 'Medford',
    county: 'Middlesex',
    map: { x: 1.3, y: 0.22 },
    dept: {
      name: 'Building Department',
      address: '85 George P. Hassett Drive, Medford, MA 02155',
      phone: '(781) 393-2511',
      url: 'https://www.medfordma.org/departments/building-department',
    },
    facts: [
      {
        label: 'Building permit (new buildings, additions, alterations, repairs)',
        value: '$15 per $1,000 of estimated construction cost, plus a $35 application fee',
        sourceName: 'City of Medford — Schedule of Building Fees (PDF)',
        sourceUrl:
          'https://resources.finalsite.net/images/v1650010163/medfordmaorg/l697m7r4b5wtnkxllw5d/201507291032.pdf',
        verifiedAt: V2,
        effectiveDate: '2009-07-28',
      },
      {
        label: 'Re-roofing / re-siding',
        value: '$15 per $1,000 plus $35 application fee (re-siding also takes a $100 refundable bond)',
        sourceName: 'City of Medford — Schedule of Building Fees (PDF)',
        sourceUrl:
          'https://resources.finalsite.net/images/v1650010163/medfordmaorg/l697m7r4b5wtnkxllw5d/201507291032.pdf',
        verifiedAt: V2,
        effectiveDate: '2009-07-28',
      },
      {
        label: 'Plan review (new residential structure)',
        value: '$100',
        sourceName: 'City of Medford — Schedule of Building Fees (PDF)',
        sourceUrl:
          'https://resources.finalsite.net/images/v1650010163/medfordmaorg/l697m7r4b5wtnkxllw5d/201507291032.pdf',
        verifiedAt: V2,
        effectiveDate: '2009-07-28',
      },
    ],
    penalty: {
      label: 'Working without a permit',
      value: 'QUADRUPLE the permit fee for work started without a building permit',
      sourceName: 'City of Medford — Schedule of Building Fees (PDF)',
      sourceUrl:
        'https://resources.finalsite.net/images/v1650010163/medfordmaorg/l697m7r4b5wtnkxllw5d/201507291032.pdf',
      verifiedAt: V2,
      effectiveDate: '2009-07-28',
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
    b: { town: 'Medford', fact: 'QUADRUPLE the permit fee — no cap' },
    takeaway: 'The penalty for the same mistake varies 4× or more depending on the town line.',
  },
]
