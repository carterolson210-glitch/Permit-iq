import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, seg, SCENES } from './scroll'
import DocumentScene from './DocumentScene'
import MassMap from './MassMap'
import BlueprintBackdrop from './BlueprintBackdrop'

const BG = '#f8fafc' // matches page bg (slate-50) so the canvas blends in

// Damps raw ScrollTrigger progress into scrollState.smooth and drives the
// camera like a dolly/crane move rather than a page scroll.
function CameraRig() {
  const pos = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3())

  useFrame(({ camera }, delta) => {
    scrollState.smooth = THREE.MathUtils.damp(
      scrollState.smooth,
      scrollState.progress,
      8,
      delta
    )
    const p = scrollState.smooth

    // S1 — push in from a high three-quarter angle to face-on
    const a = seg(p, SCENES.s1.a, SCENES.s1.b)
    // S2 — ease back out to give the exploding fields room
    const b = seg(p, SCENES.s2.a, SCENES.s2.b)
    // S3 — crane up and over, tilting down toward the map
    const c = seg(p, SCENES.s3.a, SCENES.s3.a + 0.16)
    // S4 — slow push toward the map as the dashboard takes over
    const d = seg(p, SCENES.s4.a, SCENES.s4.b)

    pos.current.set(
      Math.sin(a * Math.PI) * 1.1 - Math.sin(b * Math.PI) * 0.7,
      THREE.MathUtils.lerp(0.55, 0.05, a),
      THREE.MathUtils.lerp(9.2, 6.4, a) + b * 1.0
    )
    look.current.set(0, THREE.MathUtils.lerp(0.1, 0, a), 0)

    if (c > 0) {
      pos.current.set(
        pos.current.x * (1 - c),
        THREE.MathUtils.lerp(pos.current.y, 4.6, c) + d * 0.9,
        THREE.MathUtils.lerp(pos.current.z, 4.4, c) - d * 1.2
      )
      look.current.set(0, THREE.MathUtils.lerp(0, -1.55, c), -0.5 * c)
    }

    camera.position.copy(pos.current)
    camera.lookAt(look.current)
  })
  return null
}

export default function HeroScene() {
  const { scene } = useThree()
  if (!scene.fog) {
    scene.fog = new THREE.Fog(BG, 8, 18)
    scene.background = new THREE.Color(BG)
  }

  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} />
      <directionalLight position={[-6, -2, 4]} intensity={0.25} color="#bfdbfe" />
      <DocumentScene />
      <MassMap />
      <BlueprintBackdrop />
    </>
  )
}
