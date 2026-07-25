import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from './scroll'

// Camera dolly along a smooth Catmull-Rom path rather than teleporting between
// fixed positions. Position and look-at each ride their own spline, sampled by
// the damped scroll progress; an extra damp3 on the camera adds the lag that
// makes the move feel like a crane, not a scrollbar.
//
// Key poses, in scroll order:
//   0  establish (high three-quarter on the document)
//   1  face-on the document (scene 1 settle)
//   2  ease back for the break-apart (scene 2)
//   3  crane up and over toward the map (scene 3)
//   4  descend toward the map as the report takes over (scene 4)
const POSITIONS: [number, number, number][] = [
  [1.05, 1.15, 9.7],
  [0.0, 0.18, 6.5],
  [0.35, 0.7, 8.1],
  [0.15, 4.5, 4.7],
  [0.0, 3.0, 3.5],
]
const LOOKATS: [number, number, number][] = [
  [0, 0.1, 0],
  [0, 0.0, 0],
  [0, 0.0, 0],
  [0, -1.35, -0.4],
  [0, -1.45, -0.55],
]

export default function CameraPath() {
  const posCurve = useMemo(
    () => new THREE.CatmullRomCurve3(POSITIONS.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.5),
    []
  )
  const lookCurve = useMemo(
    () => new THREE.CatmullRomCurve3(LOOKATS.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.5),
    []
  )

  const targetPos = useRef(new THREE.Vector3(...POSITIONS[0]))
  const targetLook = useRef(new THREE.Vector3(...LOOKATS[0]))
  const look = useRef(new THREE.Vector3(...LOOKATS[0]))

  useFrame(({ camera }, delta) => {
    // damp raw scroll → smooth (same signal the geometry reads)
    scrollState.smooth = THREE.MathUtils.damp(scrollState.smooth, scrollState.progress, 8, delta)
    const t = THREE.MathUtils.clamp(scrollState.smooth, 0, 1)

    posCurve.getPoint(t, targetPos.current)
    lookCurve.getPoint(t, targetLook.current)

    // extra lag on the rig itself for that "expensive" crane feel
    dampV3(camera.position, targetPos.current, 6.5, delta)
    dampV3(look.current, targetLook.current, 7.5, delta)
    camera.lookAt(look.current)
  })

  return null
}

function dampV3(cur: THREE.Vector3, to: THREE.Vector3, lambda: number, dt: number) {
  cur.x = THREE.MathUtils.damp(cur.x, to.x, lambda, dt)
  cur.y = THREE.MathUtils.damp(cur.y, to.y, lambda, dt)
  cur.z = THREE.MathUtils.damp(cur.z, to.z, lambda, dt)
}
