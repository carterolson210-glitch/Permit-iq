import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, seg } from './scroll'
import PermitDocument from './PermitDocument'
import BlueprintBackdrop from './BlueprintBackdrop'

const BG = '#f8fafc' // matches page bg (slate-50) so the canvas blends in

// Damps raw ScrollTrigger progress into scrollState.smooth and drives the
// camera like a dolly/crane move rather than a page scroll.
function CameraRig() {
  const target = useRef(new THREE.Vector3())

  useFrame(({ camera }, delta) => {
    scrollState.smooth = THREE.MathUtils.damp(
      scrollState.smooth,
      scrollState.progress,
      8,
      delta
    )
    const p = scrollState.smooth

    // Scene 1: slow push-in while drifting off-axis, then re-center.
    const a = seg(p, 0, 0.3)
    const b = seg(p, 0.12, 0.3)
    camera.position.z = THREE.MathUtils.lerp(9.2, 6.4, a)
    camera.position.x = Math.sin(a * Math.PI) * 1.1
    camera.position.y = THREE.MathUtils.lerp(0.55, 0.05, a)

    target.current.set(0, THREE.MathUtils.lerp(0.1, 0, b), 0)
    camera.lookAt(target.current)
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
      <PermitDocument />
      <BlueprintBackdrop />
    </>
  )
}
