import { useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { scrollState } from './scroll'

/**
 * Mounts children only while scroll progress is within [from, to] (plus a
 * margin so mount/unmount doesn't pop visibly right at the edge of a
 * transition). Unlike toggling a mesh's `visible` flag, this actually stops
 * a drei helper's own per-frame cost — things like MeshTransmissionMaterial
 * and ContactShadows render an extra full scene pass on every frame via
 * their own internal useFrame, for as long as they're mounted, regardless
 * of any `visible` prop on the mesh they're attached to.
 */
export function ScrollGate({
  from,
  to,
  margin = 0.03,
  children,
}: {
  from: number
  to: number
  margin?: number
  children: ReactNode
}) {
  const inRange = () => {
    const p = scrollState.smooth
    return p >= from - margin && p <= to + margin
  }
  const [on, setOn] = useState(inRange)
  useFrame(() => {
    const next = inRange()
    if (next !== on) setOn(next)
  })
  return on ? <>{children}</> : null
}
