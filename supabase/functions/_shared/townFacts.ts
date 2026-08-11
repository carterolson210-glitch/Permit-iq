// Verified town facts used to ground AI report generation for the towns we've
// hand-verified against official municipal sources (see src/data/townPermits.ts,
// the source of truth). Mirrors ONLY the fields needed to inject into the OpenAI
// prompt (name, department, fee facts, penalty) — no map coordinates or portal
// links. Regenerate if src/data/townPermits.ts changes:
//
//   npx esbuild src/data/townPermits.ts --bundle --format=esm --outfile=/tmp/tp.mjs
//   node -e "import('/tmp/tp.mjs').then(m => console.log(JSON.stringify(m.TOWN_PROFILES.map(t => ({name:t.name,dept:t.dept.name,facts:t.facts.map(f=>({label:f.label,value:f.value})),penalty:t.penalty?t.penalty.value:null})), null, 2)))"
//
// Keep in sync with src/data/townPermits.ts.

export type VerifiedTownFacts = {
  name: string
  dept: string
  facts: { label: string; value: string }[]
  penalty: string | null
}

export const VERIFIED_TOWN_FACTS: VerifiedTownFacts[] = [
  {
    "name": "Boston",
    "dept": "Inspectional Services Department (ISD)",
    "facts": [
      {
        "label": "Short-form building permit (minor alteration)",
        "value": "$20 primary fee plus $10 per $1,000 of the estimated cost of work"
      },
      {
        "label": "Long-form building permit (major alteration, 1–3 family)",
        "value": "$50 primary fee plus $10 per $1,000 of the estimated cost of work"
      },
      {
        "label": "Plumbing permit",
        "value": "$20 primary fee plus $5 per fixture"
      }
    ],
    "penalty": "DOUBLE FEE — when work has started without a required permit, or the estimated cost was undervalued"
  },
  {
    "name": "Cambridge",
    "dept": "Inspectional Services Department",
    "facts": [
      {
        "label": "Building permit (standard rate)",
        "value": "$20 per $1,000 (or fraction) of construction cost — $50 minimum"
      },
      {
        "label": "Building permit (residential, 3 units or fewer)",
        "value": "$15 per $1,000 (or fraction) of construction cost — $50 minimum"
      },
      {
        "label": "Certificate of occupancy (residential)",
        "value": "$100 for the first unit, $50 for each additional unit"
      }
    ],
    "penalty": null
  },
  {
    "name": "Worcester",
    "dept": "Inspectional Services — Building & Zoning Division",
    "facts": [
      {
        "label": "Building permit",
        "value": "$12 per $1,000 (or fraction) of construction value; $9 per $1,000 over $1,000,000 — $100 minimum"
      },
      {
        "label": "Fences",
        "value": "Fences 7 feet or less do not require a building permit"
      },
      {
        "label": "Sheds",
        "value": "Sheds over 200 sq. ft. require a building permit"
      },
      {
        "label": "Paper applications",
        "value": "$50 administrative fee for permits submitted over-the-counter or by mail"
      }
    ],
    "penalty": "Triple the original permit fee — minimum penalty $500 (residential) or $1,000 (commercial)"
  },
  {
    "name": "Springfield",
    "dept": "Code Enforcement — Building Division",
    "facts": [
      {
        "label": "New construction / additions (1 & 2 family)",
        "value": "$250 minimum, or $8 per $1,000 of value"
      },
      {
        "label": "Roofing, siding, decks, insulation, windows/doors (residential)",
        "value": "$75 flat fee"
      },
      {
        "label": "In-ground swimming pool",
        "value": "$125 ($100 above-ground with deck; $80 without)"
      },
      {
        "label": "Sheds over 200 sq. ft.",
        "value": "$50 (per MA amendments; smaller sheds are generally exempt from a building permit)"
      }
    ],
    "penalty": null
  },
  {
    "name": "Lowell",
    "dept": "Development Services",
    "facts": [
      {
        "label": "Building permit (residential & commercial)",
        "value": "$50 up to the first $1,000 of value, plus $10 per $1,000 (or fraction) above that"
      },
      {
        "label": "Certificate of occupancy",
        "value": "$75 per unit"
      },
      {
        "label": "Off-hours inspection",
        "value": "$500 (scheduled); re-inspection $50"
      }
    ],
    "penalty": "Triple (3×) the initial permit fee"
  },
  {
    "name": "Somerville",
    "dept": "Inspectional Services Department (ISD) — Building Division",
    "facts": [
      {
        "label": "Building permit",
        "value": "$20 per $1,000 of estimated cost up to $100,000; $21 per $1,000 over $100,000 — $50 minimum"
      },
      {
        "label": "Plan review fees (added to permit fee)",
        "value": "Zoning review $250; building-code review $4 per $1,000 ($50 min); safety review 0.35% of cost ($100 min)"
      },
      {
        "label": "Swimming pools",
        "value": "Above-ground $165; in-ground $275"
      }
    ],
    "penalty": "3× the permit fee (Stop Work Order issued)"
  },
  {
    "name": "Salem",
    "dept": "Inspectional Services (Building Department)",
    "facts": [
      {
        "label": "Building permit (residential, 1–2 units)",
        "value": "$75 base fee plus $15 per $1,000 of total project cost"
      },
      {
        "label": "Building permit (commercial / 3+ units)",
        "value": "$75 base fee plus $20 per $1,000 of total project cost"
      },
      {
        "label": "Application method",
        "value": "All applications are submitted online (payment via card or check through the portal)"
      }
    ],
    "penalty": null
  },
  {
    "name": "Marblehead",
    "dept": "Building Inspection Department",
    "facts": [
      {
        "label": "Building permit",
        "value": "$15 per $1,000 of estimated project cost — $30 minimum. The fee includes the wiring permit and the plumbing permit."
      },
      {
        "label": "Application",
        "value": "Completed online application stating project cost (materials + labor), signed by owner and applicant"
      }
    ],
    "penalty": null
  },
  {
    "name": "Beverly",
    "dept": "Municipal Inspections / Building Department",
    "facts": [
      {
        "label": "Building permit (residential & commercial)",
        "value": "$15 per $1,000 of construction value (rounded up to the next $1,000) — $65 minimum"
      },
      {
        "label": "Residential solar",
        "value": "$10 per panel — $500 maximum (residential); $1,000 maximum (commercial)"
      },
      {
        "label": "Inspection scheduling",
        "value": "Inspections are normally scheduled within 2–4 business days"
      }
    ],
    "penalty": "Double (2×) the original fee — maximum additional fee $1,000"
  },
  {
    "name": "Lynn",
    "dept": "Inspectional Services Department (ISD)",
    "facts": [
      {
        "label": "Building permit (residential, 1–2 family)",
        "value": "$18 per $1,000 of estimated construction value — $100 minimum"
      },
      {
        "label": "Building permit (commercial, all others)",
        "value": "$22 per $1,000 of estimated construction value — $150 minimum"
      },
      {
        "label": "Decision timeline",
        "value": "A decision should be made on building permits within thirty (30) days"
      }
    ],
    "penalty": "Triple (3×) the calculated permit fee for all work begun without a permit"
  },
  {
    "name": "Quincy",
    "dept": "Inspectional Services Department",
    "facts": [
      {
        "label": "Building permit",
        "value": "$20 for the first $1,000 of estimated construction cost, then $12 per additional $1,000 (or part thereof)"
      },
      {
        "label": "Change of occupancy",
        "value": "$60"
      }
    ],
    "penalty": "Double the permit fee, charged from the 6th day after work commences without a permit"
  },
  {
    "name": "Newton",
    "dept": "Inspectional Services Department",
    "facts": [
      {
        "label": "Building permit",
        "value": "$20 per $1,000 of estimated construction cost (rounded up to the nearest thousand) — $50 minimum residential, $100 minimum commercial"
      }
    ],
    "penalty": null
  },
  {
    "name": "Brookline",
    "dept": "Building Department",
    "facts": [
      {
        "label": "Building permit",
        "value": "$20 per $1,000 of construction value (or fraction thereof) — $50 minimum"
      },
      {
        "label": "Re-inspection / missed final inspection",
        "value": "$50 per re-inspection; $50 if final inspection is not called for within ten working days"
      }
    ],
    "penalty": "Fee rises to $50 per $1,000 of construction value — 2.5× the normal rate"
  },
  {
    "name": "Brockton",
    "dept": "Building Department",
    "facts": [
      {
        "label": "Building permit",
        "value": "$100 for the first $5,000 of construction valuation, then $20 per additional $1,000 (or fraction thereof) — $100 minimum"
      },
      {
        "label": "Inspection scheduling",
        "value": "Building inspectors available 7:00 AM–3:00 PM weekdays; inspection windows 8:30–10:00 AM and 3:00–4:30 PM"
      }
    ],
    "penalty": null
  },
  {
    "name": "Plymouth",
    "dept": "Department of Inspectional Services",
    "facts": [
      {
        "label": "New residential construction",
        "value": "$14 per $1,000 of calculated construction cost (valued at $110/sq ft) — $250 minimum"
      },
      {
        "label": "Additions / alterations / renovations",
        "value": "$13 per $1,000 of calculated construction cost (valued at $100/sq ft) — $75 minimum"
      },
      {
        "label": "Express permits (roofing, siding, windows/doors)",
        "value": "$75 flat for one; $140 for two combined; $200 for all three"
      },
      {
        "label": "Swimming pools",
        "value": "Above-ground $100; in-ground $200"
      }
    ],
    "penalty": null
  },
  {
    "name": "Fall River",
    "dept": "Inspectional Services — Building Division",
    "facts": [
      {
        "label": "New residential construction",
        "value": "$0.19 per square foot, including basement, decks, porches, and garages — calculated by the Building Inspector"
      },
      {
        "label": "Cost estimates are checked",
        "value": "If the division believes the declared cost estimate is too low, it may set a new value after examination"
      }
    ],
    "penalty": null
  },
  {
    "name": "Framingham",
    "dept": "Inspectional Services — Building Division",
    "facts": [
      {
        "label": "Building permit (residential & commercial)",
        "value": "$15 per $1,000 of actual construction cost — $50 minimum residential, $100 minimum commercial"
      },
      {
        "label": "Occupancy permit",
        "value": "$100 per dwelling or commercial unit"
      },
      {
        "label": "Re-inspection",
        "value": "$75 per notice; after-hours inspection $220"
      }
    ],
    "penalty": "Double the building permit fee"
  },
  {
    "name": "Waltham",
    "dept": "Building Department",
    "facts": [
      {
        "label": "Building permit (residential)",
        "value": "$12 per $1,000 of estimated job cost — $50 minimum"
      },
      {
        "label": "Building permit (commercial)",
        "value": "$22 per $1,000 of estimated job cost — $100 minimum"
      },
      {
        "label": "Plumbing permit (residential)",
        "value": "$25 for the first fixture, $10 each additional"
      }
    ],
    "penalty": null
  },
  {
    "name": "Haverhill",
    "dept": "Inspectional Services — Building Division",
    "facts": [
      {
        "label": "Alterations / additions / repairs",
        "value": "$50 for the first $2,000 of project value, then $14 per additional $1,000 (or portion thereof)"
      },
      {
        "label": "New construction",
        "value": "$25 application plus $13 per $1,000 of construction cost (residential and commercial), no maximum"
      },
      {
        "label": "Permit card required on site",
        "value": "The physical permit card must be posted on site before work begins"
      }
    ],
    "penalty": null
  },
  {
    "name": "Medford",
    "dept": "Building Department",
    "facts": [
      {
        "label": "Building permit (new buildings, additions, alterations, repairs)",
        "value": "$15 per $1,000 of estimated construction cost, plus a $35 application fee"
      },
      {
        "label": "Re-roofing / re-siding",
        "value": "$15 per $1,000 plus $35 application fee (re-siding also takes a $100 refundable bond)"
      },
      {
        "label": "Plan review (new residential structure)",
        "value": "$100"
      }
    ],
    "penalty": "QUADRUPLE the permit fee for work started without a building permit"
  },
  {
    "name": "Lawrence",
    "dept": "Inspectional Services Department",
    "facts": [
      {
        "label": "Building permit (new construction, additions, alterations)",
        "value": "$12 per $1,000 of construction valuation"
      },
      {
        "label": "Occupancy permit & re-inspections",
        "value": "Occupancy permit $75; re-inspection $50; missed inspection appointment $50"
      }
    ],
    "penalty": null
  },
  {
    "name": "Malden",
    "dept": "Inspectional Services Department",
    "facts": [
      {
        "label": "Building permit (single- & two-family)",
        "value": "$13 per $1,000 of estimated construction cost — $40 minimum"
      },
      {
        "label": "Building permit (three-family & above / commercial)",
        "value": "$16 per $1,000 of estimated cost, plus a $75–$250 plan review fee by project size — $75 minimum"
      },
      {
        "label": "Certificate of occupancy",
        "value": "Single-family $75; two-family $95; three-family $115; commercial/retail $125"
      }
    ],
    "penalty": "TRIPLE the permit fee for work started without a permit"
  },
  {
    "name": "Peabody",
    "dept": "Inspectional Services Department",
    "facts": [
      {
        "label": "Building permit (new construction, additions, alterations, demolition)",
        "value": "$15 per $1,000 (one- and two-family) or $20 per $1,000 (all other buildings) of total construction value — $75 minimum, value rounded up to the next $1,000"
      },
      {
        "label": "Certificate of occupancy (existing buildings)",
        "value": "$125; re-inspection for incomplete work $75"
      }
    ],
    "penalty": "DOUBLE (2×) the original permit fee for work done without a permit"
  },
  {
    "name": "Revere",
    "dept": "Building Division",
    "facts": [
      {
        "label": "Building permit (one- & two-family)",
        "value": "$12 per $1,000 of construction cost, plus a $50 application fee on every building permit"
      },
      {
        "label": "Building permit (commercial & 3+ family)",
        "value": "$15 per $1,000 of contract value, plus a tiered plan review fee ($200 at $20,000 up to $3,500 at $500,000)"
      },
      {
        "label": "Certificate of occupancy (single-family)",
        "value": "$100 with a building permit — $200 without one"
      }
    ],
    "penalty": "ALL fees are doubled when work is done without permits"
  },
  {
    "name": "Taunton",
    "dept": "Building Department",
    "facts": [
      {
        "label": "Building permit (residential)",
        "value": "1% of the contract price plus a 4% surcharge (or $0.40 per sq ft for new construction) — $52 minimum"
      },
      {
        "label": "Building permit (commercial)",
        "value": "1.2% of the contract price plus a 4% surcharge (or $0.50 per sq ft for new construction) — $104 minimum"
      },
      {
        "label": "Certificate of occupancy",
        "value": "$104 per unit; re-inspection $52"
      }
    ],
    "penalty": "TRIPLE FEE for any work performed without a permit (building, plumbing, gas, or electrical)"
  },
  {
    "name": "Chicopee",
    "dept": "Building Department",
    "facts": [
      {
        "label": "Building permit (new 1–2 family home)",
        "value": "Flat fee by size: $320 up to 1,000 sq ft; $420 to 2,000 sq ft; $520 above 2,000 sq ft"
      },
      {
        "label": "Residential additions / alterations / repairs",
        "value": "Tiered flat fee by project cost: $45 (under $1,000) up to $220 ($25,000 and over)"
      },
      {
        "label": "Commercial new construction",
        "value": "$20 plus $0.50 per sq ft per floor — $520 minimum; certificate of occupancy $55; re-inspection $30"
      }
    ],
    "penalty": null
  },
  {
    "name": "Weymouth",
    "dept": "Department of Municipal Licenses and Inspections",
    "facts": [
      {
        "label": "Building permit (single-family)",
        "value": "$10 per $1,000 of construction value — $50 minimum"
      },
      {
        "label": "Building permit (all other buildings)",
        "value": "$20 per $1,000 of construction value — $100 minimum"
      }
    ],
    "penalty": null
  },
  {
    "name": "Methuen",
    "dept": "Inspections Division",
    "facts": [
      {
        "label": "Building permit (new construction, additions, alterations, pools, demolition)",
        "value": "$13 per $1,000 of stated construction value — $50 minimum"
      },
      {
        "label": "Certificate of occupancy",
        "value": "$50 per residential unit; $100 per commercial unit; re-inspection $50; paper filing adds $30"
      }
    ],
    "penalty": "300% of the building permit fee, plus $100 to release the stop-work order"
  },
  {
    "name": "Gloucester",
    "dept": "Inspectional Services — Building Inspector",
    "facts": [
      {
        "label": "Building permit",
        "value": "$50 application fee plus $10 per $1,000 of total construction cost — $60 minimum"
      },
      {
        "label": "Inspections",
        "value": "By appointment only — inspection line staffed weekdays 8:30–9:30 AM"
      }
    ],
    "penalty": null
  },
  {
    "name": "Arlington",
    "dept": "Inspectional Services Department",
    "facts": [
      {
        "label": "Building permit (1–2 family, other buildings, demolition)",
        "value": "$20 per $1,000 of estimated cost of work up to $15,000,000; $5 per $1,000 above that"
      },
      {
        "label": "Electrical / plumbing / gas permits",
        "value": "$30 per $1,000 of estimated cost of work (each trade)"
      }
    ],
    "penalty": null
  }
]

const byName = new Map(VERIFIED_TOWN_FACTS.map((t) => [t.name.toLowerCase(), t]))

/** Match a free-text town name (e.g. from a scan request) to verified facts. */
export function getVerifiedTownFacts(name: string): VerifiedTownFacts | undefined {
  return byName.get(name.trim().toLowerCase().replace(/,?\s*(ma|massachusetts)\.?$/i, ''))
}

/** Renders a block to inject into the AI prompt when the town is verified. */
export function verifiedFactsPromptBlock(name: string): string | null {
  const t = getVerifiedTownFacts(name)
  if (!t) return null
  const lines = t.facts.map((f) => `- ${f.label}: ${f.value}`).join('\n')
  const penaltyLine = t.penalty ? `\nPenalty for working without a permit: ${t.penalty}` : ''
  return `VERIFIED DATA for ${t.name} (from ${t.dept}, hand-checked against the town's official published fee schedule — use these exact figures instead of estimating whenever they answer the question; do not contradict them):
${lines}${penaltyLine}

Any fee or requirement covered by the verified data above should be reported with confidence "high" for that specific item. Only use "medium" or "low" confidence for details not covered by the verified data (e.g. permits, thresholds, or fees not listed above).`
}
