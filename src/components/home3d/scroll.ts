import { MathUtils } from 'three'

// Shared mutable scroll state. The DOM-side GSAP ScrollTrigger writes into it;
// the R3F frame loop reads (and smooths) it. Kept outside React state so a
// 60fps scrub never triggers a React render.
export const scrollState = {
  /** Raw pinned-section progress, 0..1, written by ScrollTrigger onUpdate. */
  progress: 0,
  /** Scroll velocity (px/s, sign = direction), written by ScrollTrigger. */
  velocity: 0,
  /** Damped progress, updated each frame inside the Canvas. */
  smooth: 0,
}

// Scene boundaries across the full pinned sequence (fractions of progress).
// S1 intro document · S2 break-apart into fields · S3 Massachusetts map ·
// S4 dashboard consolidation/reveal.
export const SCENES = {
  s1: { a: 0, b: 0.2 },
  s2: { a: 0.2, b: 0.45 },
  s3: { a: 0.45, b: 0.75 },
  s4: { a: 0.75, b: 1 },
} as const

/** Remap progress p into a 0..1 sub-range [start, end], clamped. */
export function range(p: number, start: number, end: number): number {
  return MathUtils.clamp((p - start) / (end - start), 0, 1)
}

/** Smoothstep ease — cheap, symmetric, good default for scrubbed motion. */
export function ease(t: number): number {
  return t * t * (3 - 2 * t)
}

/** Eased sub-range: ease(range(p, start, end)). */
export function seg(p: number, start: number, end: number): number {
  return ease(range(p, start, end))
}
