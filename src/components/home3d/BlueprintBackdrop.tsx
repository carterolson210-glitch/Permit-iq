import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from './scroll'

// Layered blueprint scenery at different z-depths. Each layer translates at a
// different rate as scroll progresses, selling camera depth (parallax) beyond
// what the camera dolly alone provides. Pure line/ring geometry — very cheap.

function GridLayer({
  z,
  size,
  divisions,
  opacity,
  rate,
}: {
  z: number
  size: number
  divisions: number
  opacity: number
  rate: number
}) {
  const ref = useRef<THREE.Group>(null)
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(size, divisions, '#3b82f6', '#94a3b8')
    const mat = g.material as THREE.LineBasicMaterial
    mat.transparent = true
    mat.opacity = opacity
    mat.depthWrite = false
    g.rotation.x = Math.PI / 2 // face the camera
    return g
  }, [size, divisions, opacity])

  useFrame(() => {
    if (!ref.current) return
    // deeper layers drift less → parallax
    ref.current.position.y = scrollState.smooth * rate
  })

  return (
    <group ref={ref} position={[0, 0, z]}>
      <primitive object={grid} />
    </group>
  )
}

function StampRing({
  position,
  radius,
  rate,
}: {
  position: [number, number, number]
  radius: number
  rate: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = position[1] + scrollState.smooth * rate
    ref.current.rotation.z = clock.elapsedTime * 0.05
  })
  return (
    <mesh ref={ref} position={position}>
      <ringGeometry args={[radius * 0.82, radius, 48, 1]} />
      <meshBasicMaterial color="#60a5fa" transparent opacity={0.14} depthWrite={false} />
    </mesh>
  )
}

export default function BlueprintBackdrop() {
  return (
    <group>
      <GridLayer z={-9} size={70} divisions={34} opacity={0.1} rate={1.6} />
      <GridLayer z={-5.5} size={44} divisions={22} opacity={0.14} rate={3.2} />
      <StampRing position={[-4.4, 2.4, -6]} radius={1.6} rate={2.6} />
      <StampRing position={[4.8, -1.8, -7.5]} radius={2.2} rate={2.0} />
      <StampRing position={[3.6, 2.9, -4.5]} radius={0.9} rate={3.6} />
    </group>
  )
}
