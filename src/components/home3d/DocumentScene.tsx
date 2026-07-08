import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { scrollState, seg, SCENES } from './scroll'
import { makeDocumentTexture, makeStampTexture, makeChipTexture } from './textures'

export const DOC_W = 2.4
export const DOC_H = 3.2

const CHIP_DEFS = [
  { label: 'Permit type', value: 'Building Permit', to: new THREE.Vector3(-1.75, 1.0, 0.6) },
  { label: 'Town', value: 'Marblehead, MA', to: new THREE.Vector3(1.75, 1.0, 0.6) },
  { label: 'Timeline', value: '2–4 weeks', to: new THREE.Vector3(-1.75, -0.55, 0.6) },
  { label: 'Est. fees', value: '$150 – $320', to: new THREE.Vector3(1.75, -0.55, 0.6) },
]

// Scene 1 + 2: the permit document floats in, gets stamped, then splits into
// two halves that peel apart while extracted-field chips fly out into a grid.
export default function DocumentScene() {
  const root = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const left = useRef<THREE.Group>(null)
  const right = useRef<THREE.Group>(null)
  const stamp = useRef<THREE.Mesh>(null)
  const chips = useRef<(THREE.Group | null)[]>([])
  const glass = useRef<(THREE.Mesh | null)[]>([])

  const docTex = useMemo(makeDocumentTexture, [])
  // Left/right halves of the printed face share the canvas via UV windows.
  const [texL, texR] = useMemo(() => {
    const l = docTex.clone()
    l.repeat.set(0.5, 1)
    l.offset.set(0, 0)
    const r = docTex.clone()
    r.repeat.set(0.5, 1)
    r.offset.set(0.5, 0)
    return [l, r]
  }, [docTex])
  const stampTex = useMemo(makeStampTexture, [])
  const chipTexes = useMemo(
    () => CHIP_DEFS.map((c) => makeChipTexture(c.label, c.value)),
    []
  )

  useFrame(({ clock }) => {
    const g = root.current
    const inn = inner.current
    if (!g || !inn || !left.current || !right.current) return
    const p = scrollState.smooth
    const t = clock.elapsedTime

    // ── Scene 1: rise from below, tilt to face-on ──
    const intro = seg(p, SCENES.s1.a, SCENES.s1.b - 0.02)
    g.rotation.x = THREE.MathUtils.lerp(-0.42, 0, intro)
    g.rotation.y = THREE.MathUtils.lerp(0.55, -0.06, intro)
    g.position.y = THREE.MathUtils.lerp(-2.1, 0, intro)

    // idle float, damped away once the doc settles
    const idle = 1 - intro * 0.6
    inn.position.y = Math.sin(t * 0.9) * 0.06 * idle
    inn.rotation.y = Math.sin(t * 0.35) * 0.06 * idle
    inn.rotation.z = THREE.MathUtils.damp(
      inn.rotation.z,
      THREE.MathUtils.clamp(scrollState.velocity * -0.00004, -0.05, 0.05),
      3,
      0.016
    )

    // stamp presses in at the end of scene 1
    if (stamp.current) {
      const press = seg(p, 0.11, 0.18)
      stamp.current.position.z = THREE.MathUtils.lerp(1.4, 0.03, press)
      stamp.current.scale.setScalar(THREE.MathUtils.lerp(1.7, 1, press))
      const m = stamp.current.material as THREE.MeshBasicMaterial
      m.opacity = press * 0.92 * (1 - seg(p, SCENES.s2.a, SCENES.s2.a + 0.12))
    }

    // ── Scene 2: halves peel apart and fade; chips fly to grid ──
    const split = seg(p, SCENES.s2.a, SCENES.s2.b - 0.03)
    const fadeOut = seg(p, SCENES.s2.a + 0.08, SCENES.s2.b)
    left.current.position.x = -DOC_W / 4 - split * 2.1
    right.current.position.x = DOC_W / 4 + split * 2.1
    left.current.rotation.y = split * -0.55
    right.current.rotation.y = split * 0.55
    left.current.position.z = right.current.position.z = split * -1.4
    setGroupOpacity(left.current, 1 - fadeOut)
    setGroupOpacity(right.current, 1 - fadeOut)

    // chips: emerge from the document center, arrive on a 2×2 grid,
    // then fly up & away as scene 3 takes over
    chips.current.forEach((chip, i) => {
      if (!chip) return
      const delay = i * 0.02
      const fly = seg(p, SCENES.s2.a + 0.04 + delay, SCENES.s2.b - 0.02 + delay)
      const exit = seg(p, SCENES.s3.a + delay, SCENES.s3.a + 0.07 + delay)
      const target = CHIP_DEFS[i].to
      chip.position.set(
        target.x * fly,
        target.y * fly + exit * (5.5 + i * 0.4),
        0.15 + fly * target.z + exit * 2.5
      )
      chip.rotation.y = (1 - fly) * (i % 2 === 0 ? -1.2 : 1.2)
      chip.rotation.x = exit * 0.6
      const s = 0.35 + fly * 0.65
      chip.scale.setScalar(s)
      setGroupOpacity(chip, fly * (1 - exit))
    })

    // glass accents fade with the document
    glass.current.forEach((m, i) => {
      if (!m) return
      const mat = m.material as THREE.MeshStandardMaterial
      mat.opacity = 0.32 * (1 - fadeOut)
      m.position.y = m.userData.baseY + Math.sin(t * 0.6 + i * 2.1) * 0.08
    })

    // once everything in this group is invisible, skip rendering it
    g.visible = p < SCENES.s3.a + 0.15
  })

  return (
    <group ref={root}>
      <group ref={inner}>
        {/* left half */}
        <group ref={left} position={[-DOC_W / 4, 0, 0]}>
          <RoundedBox args={[DOC_W / 2, DOC_H, 0.05]} radius={0.02} smoothness={3}>
            <meshStandardMaterial color="#f4f7fa" roughness={0.85} transparent />
          </RoundedBox>
          <mesh position={[0, 0, 0.028]}>
            <planeGeometry args={[DOC_W / 2 - 0.03, DOC_H - 0.06]} />
            <meshStandardMaterial map={texL} roughness={0.9} transparent />
          </mesh>
        </group>
        {/* right half (carries the stamp) */}
        <group ref={right} position={[DOC_W / 4, 0, 0]}>
          <RoundedBox args={[DOC_W / 2, DOC_H, 0.05]} radius={0.02} smoothness={3}>
            <meshStandardMaterial color="#f4f7fa" roughness={0.85} transparent />
          </RoundedBox>
          <mesh position={[0, 0, 0.028]}>
            <planeGeometry args={[DOC_W / 2 - 0.03, DOC_H - 0.06]} />
            <meshStandardMaterial map={texR} roughness={0.9} transparent />
          </mesh>
          <mesh
            ref={stamp}
            position={[0.02, -0.92, 1.4]}
            rotation={[0, 0, -0.22]}
            userData={{ ownOpacity: true }}
          >
            <planeGeometry args={[0.85, 0.85]} />
            <meshBasicMaterial map={stampTex} transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>

        {/* extracted-field chips */}
        {CHIP_DEFS.map((c, i) => (
          <group key={c.label} ref={(el) => (chips.current[i] = el)}>
            <mesh>
              <planeGeometry args={[1.7, 0.85]} />
              <meshBasicMaterial map={chipTexes[i]} transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        ))}

        {/* glass accent panels */}
        {(
          [
            [-1.7, 0.9, -0.5, 1.1, 1.5],
            [1.75, -0.5, -0.9, 1.3, 0.9],
            [-1.4, -1.35, 0.35, 0.9, 0.6],
          ] as const
        ).map(([x, y, z, w, h], i) => (
          <mesh
            key={i}
            ref={(el) => {
              glass.current[i] = el
              if (el) el.userData.baseY = y
            }}
            position={[x, y, z]}
          >
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial
              color={i === 1 ? '#e0e7ff' : '#dbeafe'}
              transparent
              opacity={0.32}
              roughness={0.2}
              metalness={0.1}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function setGroupOpacity(obj: THREE.Object3D, opacity: number) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh && !child.userData.ownOpacity) {
      ;(child.material as THREE.Material & { opacity: number }).opacity = opacity
    }
  })
  obj.visible = opacity > 0.005
}
