import { useThree } from '@react-three/fiber'
import { Environment, Lightformer, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import CameraPath from './CameraPath'
import DocumentScene from './DocumentScene'
import MassMap from './MassMap'
import ZoningOverlay from './ZoningOverlay'
import BlueprintBackdrop from './BlueprintBackdrop'
import Effects from './Effects'

const BG = '#f8fafc' // matches page bg (slate-50) so the canvas blends in

export default function HeroScene() {
  const { scene, gl } = useThree()

  // ACESFilmic + a touch of exposure for physically-based highlights on the
  // light page. (R3F defaults to ACESFilmic; we set exposure explicitly.)
  gl.toneMapping = THREE.ACESFilmicToneMapping
  gl.toneMappingExposure = 1.05

  if (!scene.fog) {
    scene.fog = new THREE.Fog(BG, 9, 20)
    scene.background = new THREE.Color(BG)
  }

  return (
    <>
      <CameraPath />

      {/* Studio lighting from an in-scene environment — Lightformers generate
          the env map at runtime with zero external fetch, so it works under the
          site's strict CSP (no HDRI CDN). One keyed directional adds shadow
          definition; a low fill lifts the shadows on the light page. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[3, 4, 5]} scale={[6, 6, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.1} position={[-5, 2, 3]} scale={[5, 5, 1]} color="#dbeafe" />
        <Lightformer form="circle" intensity={1.4} position={[0, -3, 4]} scale={[4, 4, 1]} color="#eff6ff" />
      </Environment>

      <directionalLight position={[4, 7, 5]} intensity={1.35} color="#ffffff" />
      <ambientLight intensity={0.35} />

      {/* Soft contact shadow grounding the hero document. */}
      <ContactShadows
        position={[0, -1.85, 0]}
        opacity={0.32}
        scale={12}
        blur={2.6}
        far={4}
        resolution={512}
        color="#1e293b"
      />

      <DocumentScene />
      <MassMap />
      <ZoningOverlay />
      <BlueprintBackdrop />

      <Effects />
    </>
  )
}
