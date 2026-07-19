import { useEffect, type ReactNode } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './lib/auth'
import { PageTransition } from './lib/motion'
import Landing from './pages/Landing'
import Analyze from './pages/Analyze'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import TownPermitPage from './pages/TownPermitPage'
import Pricing from './pages/Pricing'
import Checkout from './pages/Checkout'
import HowWeVerify from './pages/HowWeVerify'
import ErrorBoundary from './components/ErrorBoundary'
import GraceBanner from './components/GraceBanner'

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <motion.span
        className="text-xl font-bold text-primary"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        PermitIQ
      </motion.span>
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return <>{children}</>
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Landing />
            </PageTransition>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PageTransition>
              <ResetPassword />
            </PageTransition>
          }
        />
        <Route
          path="/analyze"
          element={
            <RequireAuth>
              <PageTransition>
                <Analyze />
              </PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/pricing"
          element={
            <PageTransition>
              <Pricing />
            </PageTransition>
          }
        />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <PageTransition>
                <Checkout />
              </PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/how-we-verify"
          element={
            <PageTransition>
              <HowWeVerify />
            </PageTransition>
          }
        />
        <Route
          path="/permits/:slug"
          element={
            <PageTransition>
              <TownPermitPage />
            </PageTransition>
          }
        />
        <Route
          path="/privacy"
          element={
            <PageTransition>
              <Privacy />
            </PageTransition>
          }
        />
        <Route
          path="/terms"
          element={
            <PageTransition>
              <Terms />
            </PageTransition>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <MotionConfig reducedMotion="user">
            <ScrollToTop />
            <GraceBanner />
            <AnimatedRoutes />
          </MotionConfig>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
