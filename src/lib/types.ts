// 'homeowner' and 'firm' are legacy plan values (gated as pro/contractor).
export type Plan = 'free' | 'pro' | 'homeowner' | 'contractor' | 'firm'
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | null
export type Role = 'homeowner' | 'contractor' | 'firm'
export type ProjectStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'on_hold'

export interface UserProfile {
  id: string
  email: string
  name: string | null
  role: Role
  plan: Plan
  plan_expires_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus
  billing_interval: 'monthly' | 'annual' | null
  cancel_at_period_end: boolean | null
  grace_until: string | null
  referral_code: string | null
  referred_by: string | null
  primary_town: string | null
  permits_per_year: number | null
  free_analyses_used: number
  created_at: string
}

export interface Permit {
  name: string
  issuing_authority: string
  description: string
  typical_fee_range: string
  typical_timeline: string
  required_documents: string[]
  notes: string
  /** Official municipal source this permit's details came from (newer scans). */
  source?: { title: string; url: string } | null
}

export interface ChecklistStep {
  step_number: number
  action: string
  details: string
  who_does_this: string
  estimated_time: string
}

export interface PermitAnalysis {
  project_summary: string
  permits_required: Permit[]
  total_estimated_fees: { low: number; high: number }
  total_estimated_timeline: string
  checklist: ChecklistStep[]
  common_mistakes: string[]
  pro_tips: string[]
  town_specific_notes: string
  disclaimer: string
  /** Model's own confidence in town-specific accuracy (newer scans only). */
  confidence?: 'high' | 'medium' | 'low'
  /** Public sources the model based town-specific answers on (newer scans only). */
  sources?: { title: string; url: string }[]
}

export interface Project {
  id: string
  user_id: string
  title: string
  description: string
  town: string
  category: string | null
  square_footage: number | null
  project_value: number | null
  ai_analysis: PermitAnalysis | null
  status: ProjectStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  project_id: string
  step_number: number
  action: string
  details: string | null
  who: string | null
  estimated_time: string | null
  completed: boolean
  completed_at: string | null
}

export interface DocumentRecord {
  id: string
  project_id: string
  name: string
  file_url: string
  uploaded_at: string
}

export interface ActivityLogEntry {
  id: string
  project_id: string
  action: string
  details: string | null
  created_at: string
}

export const CATEGORIES = [
  'New Construction',
  'Addition',
  'Deck or Porch',
  'Garage',
  'Accessory Dwelling Unit (ADU)',
  'Kitchen or Bath Remodel',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Roof',
  'Windows and Doors',
  'Shed or Outbuilding',
  'Pool',
  'Commercial',
  'Other',
] as const

export type ProjectCategory = (typeof CATEGORIES)[number]
