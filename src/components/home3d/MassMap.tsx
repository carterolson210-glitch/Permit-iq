import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, seg, range, SCENES } from './scroll'

// Stylized low-poly Massachusetts outline (x = east/west, y = north/south),
// hand-traced: straight west + south borders, north shore, Cape Ann, Boston
// harbor, and the Cape Cod hook. ~30 vertices total.
const OUTLINE: [number, number][] = [
  [-3.45, 0.72], // NW corner
  [-1.2, 0.8],
  [0.4, 0.86],
  [1.35, 0.92], // north shore
  [1.62, 0.66],
  [2.0, 0.6], // Cape Ann tip
  [1.78, 0.38],
  [1.52, 0.18], // Boston harbor indent
  [1.66, 0.02],
  [1.62, -0.22],
  [1.98, -0.5], // Plymouth
  [2.4, -0.5], // Cape Cod Bay rim
  [2.85, -0.42],
  [3.02, -0.1], // inner elbow
  [3.18, 0.04], // Provincetown tip
  [3.36, -0.28], // outer (Atlantic) shore
  [3.28, -0.6], // Chatham elbow
  [2.7, -0.75], // Nantucket Sound shore
  [2.15, -0.8],
  [1.6, -0.78], // Buzzards Bay
  [1.3, -0.68],
  [0.95, -0.72], // RI border
  [-3.38, -0.72], // CT border (straight)
  [-3.5, 0.0], // NY border
]

const TOWNS: { name: string; x: number; y: number }[] = [
  { name: 'Boston', x: 1.42, y: 0.1 },
  { name: 'Marblehead', x: 1.6, y: 0.32 },
  { name: 'Lowell', x: 0.85, y: 0.62 },
  { name: 'Worcester', x: 0.1, y: -0.02 },
  { name: 'Springfield', x: -1.9, y: -0.42 },
  { name: 'Northampton', x: -1.8, y: 0.1 },
  { name: 'Pittsfield', x: -3.05, y: 0.28 },
  { name: 'Plymouth', x: 1.85, y: -0.42 },
  { name: 'Barnstable', x: 2.72, y: -0.55 },
  { name: 'New Bedford', x: 1.32, y: -0.62 },
]

// A handful of low boxes hinting at downtown Boston.
const BLOCKS: [number, number, number][] = [
  [1.36, 0.06, 0.42],
  [1.46, 0.14, 0.55],
  [1.3, 0.16, 0.3],
  [1.5, 0.02, 0.35],
  [1.4, -0.04, 0.25],
  [1.56, 0.2, 0.28],
]

const MAP_Y = -1.55
const RISE_FROM = -5.0

export default function MassMap() {
  const group = useRef<THREE.Group>(null)
  const slab = useRef<THREE.Mesh>(null)
  const edges = useRef<THREE.LineSegments>(null)
  const pins = useRef<(THREE.Group | null)[]>([])
  const blocks = useRef<(THREE.Mesh | null)[]>([])
  const pulse = useRef<THREE.Mesh>(null)

  const { geometry, edgeGeometry } = useMemo(() => {
    const shape = new THREE.Shape(OUTLINE.map(([x, y]) => new THREE.Vector2(x, y)))
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false })
    const edgeGeometry = new THREE.EdgesGeometry(geometry, 12)
    return { geometry, edgeGeometry }
  }, [])

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const p = scrollState.smooth
    const t = clock.elapsedTime

    const enter = seg(p, SCENES.s3.a, SCENES.s3.a + 0.13)
    const exit = seg(p, SCENES.s4.a + 0.04, SCENES.s4.a + 0.17)
    const vis = enter * (1 - exit)

    g.visible = vis > 0.004
    if (!g.visible) return

    g.position.y = THREE.MathUtils.lerp(RISE_FROM, MAP_Y, enter) - exit * 1.6
    g.rotation.z = (1 - enter) * 0.12

    if (slab.current) {
      ;(slab.current.material as THREE.MeshStandardMaterial).opacity = 0.55 * vis
    }
    if (edges.current) {
      ;(edges.current.material as THREE.LineBasicMaterial).opacity = 0.85 * vis
    }

    // pins pop up one after another as scroll continues
    pins.current.forEach((pin, i) => {
      if (!pin) return
      const pop = seg(p, SCENES.s3.a + 0.1 + i * 0.016, SCENES.s3.a + 0.16 + i * 0.016)
      const s = pop * (1 - exit)
      pin.scale.setScalar(Math.max(s, 0.0001))
      pin.position.y = 0.14 + Math.sin(t * 1.4 + i) * 0.02 * pop
    })

    blocks.current.forEach((b, i) => {
      if (!b) return
      const grow = seg(p, SCENES.s3.a + 0.12 + i * 0.01, SCENES.s3.a + 0.2 + i * 0.01)
      const h = BLOCKS[i][2] * grow * (1 - exit)
      b.scale.y = Math.max(h, 0.0001)
      b.position.y = 0.14 + (h * 0.5)
    })

    // one radar-style scan pulse sweeping outward from Boston
    if (pulse.current) {
      const sweep = range(p, SCENES.s3.a + 0.16, SCENES.s3.b)
      const r = 0.2 + sweep * 3.4
      pulse.current.scale.setScalar(r)
      ;(pulse.current.material as THREE.MeshBasicMaterial).opacity =
        0.35 * (1 - sweep) * vis
    }
  })

  return (
    <group ref={group} position={[0, RISE_FROM, -0.4]} visible={false}>
      {/* extruded state slab, lying flat */}
      <mesh ref={slab} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#bfdbfe"
          transparent
          opacity={0}
          roughness={0.25}
          metalness={0.05}
        />
      </mesh>
      <lineSegments ref={edges} geometry={edgeGeometry} rotation={[-Math.PI / 2, 0, 0]}>
        <lineBasicMaterial color="#1d4ed8" transparent opacity={0} />
      </lineSegments>

      {/* town pins: thin stem + head */}
      {TOWNS.map((town, i) => (
        <group
          key={town.name}
          ref={(el) => (pins.current[i] = el)}
          position={[town.x, 0.14, -town.y]}
          scale={0.0001}
        >
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.4, 6]} />
            <meshStandardMaterial color="#1d4ed8" />
          </mesh>
          <mesh position={[0, 0.44, 0]}>
            <sphereGeometry args={[0.085, 12, 10]} />
            <meshStandardMaterial
              color={town.name === 'Marblehead' ? '#16a34a' : '#1d4ed8'}
              emissive={town.name === 'Marblehead' ? '#16a34a' : '#1d4ed8'}
              emissiveIntensity={0.35}
            />
          </mesh>
        </group>
      ))}

      {/* Boston blocks */}
      {BLOCKS.map(([x, y], i) => (
        <mesh
          key={i}
          ref={(el) => (blocks.current[i] = el)}
          position={[x, 0.14, -y]}
          scale={[1, 0.0001, 1]}
        >
          <boxGeometry args={[0.09, 1, 0.09]} />
          <meshStandardMaterial color="#93c5fd" transparent opacity={0.85} />
        </mesh>
      ))}

      {/* scan pulse ring (at Boston) */}
      <mesh ref={pulse} position={[1.42, 0.16, -0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 1, 48]} />
        <meshBasicMaterial color="#1d4ed8" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
