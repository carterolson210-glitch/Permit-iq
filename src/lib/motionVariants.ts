import type { Variants } from 'framer-motion'

// Shared easing: fast start, gentle settle. Calm and precise — no bounce.
export const EASE = [0.25, 0.1, 0.25, 1] as const

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease: EASE } },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: EASE } },
}

export const staggerChildren: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
