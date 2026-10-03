import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, RoundedBox, useFBO } from '@react-three/drei'
import * as THREE from 'three'
import { scrollState, seg, SCENES } from './scroll'

// Translucent "zoning overlay" planes that stack above the Worcester parcel as
// the camera cranes over the map (scene 3). They read as authoritative glass
// rather than colored quads — real light transmission, a faint tint, a thin
// emissive edge. Labels stay in the DOM (legible + crawlable); these are the
// depth/《authority》 cue.
//
// Worcester sits at map coords (0.1, -0.02); the map group lies at y ≈ -1.55.
const WORCESTER = new THREE.Vector3(0.1, -1.4, 0.02)

type Layer = { tint: string; y: number; size: number }
const LAYERS: Layer[] = [
  { tint: '#bfdbfe', y: 0.28, size: 1.35 }, // zoning district
  { tint: '#a7f3d0', y: 0.62, size: 1.08 }, // setback envelope
  { tint: '#ddd6fe', y: 0.98, size: 0.82 }, // lot coverage
]

export default function ZoningOverlay() {
  const group = useRef<THREE.Group>(null)
  const layers = useRef<(THREE.Group | null)[]>([])

  // Slight per-layer drift so the stack feels alive, not rigid.
  const phases = useMemo(() => LAYERS.map((_, i) => i * 1.7), [])

  // One shared backbuffer capture for all 3 glass layers. Without this,
  // each MeshTransmissionMaterial instance does its own full extra scene
  // render every frame (that's what `buffer` opts out of) — sharing one
  // cuts that 3x cost down to 1x for the ~20% of scroll this is mounted.
  const fbo = useFBO(128)

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const p = scrollState.smooth
    const t = state.clock.elapsedTime

    // in as the map rises (scene 3), out as scene 4 hands off to the report
    const enter = seg(p, SCENES.s3.a + 0.06, SCENES.s3.a + 0.2)
    const exit = seg(p, SCENES.s4.a + 0.02, SCENES.s4.a + 0.16)
    const vis = enter * (1 - exit)
    g.visible = vis > 0.004
    if (!g.visible) return

    layers.current.forEach((layer, i) => {
      if (!layer) return
      const stagger = seg(p, SCENES.s3.a + 0.08 + i * 0.03, SCENES.s3.a + 0.2 + i * 0.03)
      const s = stagger * (1 - exit)
      layer.scale.setScalar(Math.max(s, 0.0001))
      layer.position.y =
        WORCESTER.y + LAYERS[i].y * stagger + Math.sin(t * 0.8 + phases[i]) * 0.03 * s + exit * 1.4
      layer.rotation.z = (1 - stagger) * 0.3
    })

    g.visible = false
    state.gl.setRenderTarget(fbo)
    state.gl.render(state.scene, state.camera)
    state.gl.setRenderTarget(null)
    g.visible = true
  })

  return (
    <group ref={group} position={[WORCESTER.x, 0, -WORCESTER.z]} visible={false}>
      {LAYERS.map((layer, i) => (
        <group key={i} ref={(el) => (layers.current[i] = el)} scale={0.0001}>
          {/* the glass slab */}
          <RoundedBox
            args={[layer.size, layer.size, 0.045]}
            radius={0.03}
            smoothness={4}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <MeshTransmissionMaterial
              buffer={fbo.texture}
              transmission={1}
              thickness={0.35}
              roughness={0.1}
              ior={1.3}
              chromaticAberration={0.03}
              anisotropy={0.1}
              distortion={0.08}
              distortionScale={0.2}
              temporalDistortion={0.08}
              color={layer.tint}
              background={new THREE.Color('#eef4ff')}
              transparent
              samples={4}
              // Unused now that `buffer` is set (see fbo above) — kept small
              // just to bound the otherwise-dead per-instance FBO allocation,
              // which defaults to full canvas resolution if omitted.
              resolution={64}
            />
          </RoundedBox>
          {/* thin bright edge so the plane reads as a discrete overlay */}
          <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
            <edgesGeometry args={[new THREE.BoxGeometry(layer.size, layer.size, 0.045)]} />
            <lineBasicMaterial color="#1d4ed8" transparent opacity={0.5} />
          </lineSegments>
        </group>
      ))}
    </group>
  )
}
