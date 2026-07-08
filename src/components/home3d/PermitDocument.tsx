import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { scrollState, seg } from './scroll'
import { makeDocumentTexture, makeStampTexture } from './textures'

export const DOC_W = 2.4
export const DOC_H = 3.2

// The hero permit document: a thin rounded slab of "paper" with a procedural
// blueprint texture, a stamp, and a few translucent glass accent panels.
// All motion is derived from scrollState.smooth each frame.
export default function PermitDocument() {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const stamp = useRef<THREE.Mesh>(null)

  const docTex = useMemo(makeDocumentTexture, [])
  const stampTex = useMemo(makeStampTexture, [])

  useFrame(({ clock }) => {
    const g = group.current
    const inn = inner.current
    if (!g || !inn) return
    const p = scrollState.smooth
    const t = clock.elapsedTime

    // Scene 1 choreography (p 0 → 0.3): tilted showcase → face-on.
    const intro = seg(p, 0, 0.3)
    g.rotation.x = THREE.MathUtils.lerp(-0.42, 0, intro)
    g.rotation.y = THREE.MathUtils.lerp(0.55, -0.08, intro)
    g.position.y = THREE.MathUtils.lerp(-0.15, 0, intro)

    // Idle float layered on top — fades out as the doc settles face-on,
    // plus a small velocity kick so fast scrolling visibly "drags" the doc.
    const idle = 1 - intro * 0.6
    inn.position.y = Math.sin(t * 0.9) * 0.06 * idle
    inn.rotation.y = Math.sin(t * 0.35) * 0.06 * idle
    inn.rotation.z = THREE.MathUtils.damp(
      inn.rotation.z,
      THREE.MathUtils.clamp(scrollState.velocity * -0.00004, -0.05, 0.05),
      3,
      0.016
    )

    // Stamp presses in during the last part of scene 1.
    if (stamp.current) {
      const press = seg(p, 0.16, 0.28)
      stamp.current.position.z = THREE.MathUtils.lerp(1.4, 0.03, press)
      const s = THREE.MathUtils.lerp(1.7, 1, press)
      stamp.current.scale.setScalar(s)
      const mat = stamp.current.material as THREE.MeshBasicMaterial
      mat.opacity = press * 0.92
    }
  })

  return (
    <group ref={group}>
      <group ref={inner}>
        {/* paper slab */}
        <RoundedBox args={[DOC_W, DOC_H, 0.05]} radius={0.02} smoothness={3}>
          <meshStandardMaterial color="#f4f7fa" roughness={0.85} metalness={0} />
        </RoundedBox>
        {/* printed front face */}
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[DOC_W - 0.06, DOC_H - 0.06]} />
          <meshStandardMaterial map={docTex} roughness={0.9} />
        </mesh>
        {/* stamp */}
        <mesh ref={stamp} position={[0.62, -0.92, 1.4]} rotation={[0, 0, -0.22]}>
          <planeGeometry args={[0.85, 0.85]} />
          <meshBasicMaterial map={stampTex} transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* glass accent panels for depth */}
        <GlassPanel position={[-1.7, 0.9, -0.5]} size={[1.1, 1.5]} tint="#dbeafe" />
        <GlassPanel position={[1.75, -0.5, -0.9]} size={[1.3, 0.9]} tint="#e0e7ff" />
        <GlassPanel position={[-1.4, -1.35, 0.35]} size={[0.9, 0.6]} tint="#dbeafe" />
      </group>
    </group>
  )
}

function GlassPanel({
  position,
  size,
  tint,
}: {
  position: [number, number, number]
  size: [number, number]
  tint: string
}) {
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshStandardMaterial
        color={tint}
        transparent
        opacity={0.32}
        roughness={0.2}
        metalness={0.1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
