import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'
import type { UserProfile } from './types'

export const FREE_SCAN_LIMIT = 3

type AuthCtx = {
  user: User | null
  session: Session | null
  loading: boolean
  profile: UserProfile | null
  profileLoading: boolean
  /** True when the user has a paid plan that has not expired (or is in grace). */
  isPaid: boolean
  /** Effective feature tier; legacy homeowner/firm plans gate as pro/contractor. */
  tier: 'free' | 'pro' | 'contractor'
  /** True while a failed payment is inside its 7-day grace window. */
  inGrace: boolean
  /** Free scans left, or null for unlimited (paid) plans / unknown (profile loading). */
  scansRemaining: number | null
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  profileLoading: false,
  isPaid: false,
  tier: 'free',
  inGrace: false,
  scansRemaining: null,
  refreshProfile: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) setProfile(data as UserProfile)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setProfile(null)
      return
    }
    setProfileLoading(true)
    fetchProfile(user.id).finally(() => {
      if (!cancelled) setProfileLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user, fetchProfile])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const now = new Date()
  const inGrace = Boolean(
    profile &&
      profile.plan !== 'free' &&
      profile.grace_until &&
      new Date(profile.grace_until) > now
  )
  const isPaid = Boolean(
    profile &&
      profile.plan !== 'free' &&
      ((!profile.plan_expires_at || new Date(profile.plan_expires_at) > now) || inGrace)
  )
  const tier: 'free' | 'pro' | 'contractor' = !isPaid
    ? 'free'
    : profile!.plan === 'contractor' || profile!.plan === 'firm'
      ? 'contractor'
      : 'pro'

  const scansRemaining =
    profile && !isPaid
      ? Math.max(0, FREE_SCAN_LIMIT - (profile.free_analyses_used ?? 0))
      : null

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        profile,
        profileLoading,
        isPaid,
        tier,
        inGrace,
        scansRemaining,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
