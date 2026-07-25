import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing'

// Restrained, desktop-only post. The whole 3D hero only mounts on desktop +
// WebGL + motion-ok (see use3DHero), so this never runs on phones or under
// reduced-motion. Kept subtle on purpose: if a viewer notices the post before
// the content, it's too much.
//
//  • DepthOfField — a shallow focus that keeps the active element sharp and
//    lets the backdrop fall away, so the eye lands where the scene wants it.
//  • Bloom — mipmap-blurred, high luminance threshold, so only the emissive
//    pins/edges glow, not the whole page.
//  • Vignette — a whisper, to seat the scene on the light page.
export default function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <DepthOfField focusDistance={0.012} focalLength={0.04} bokehScale={2.2} height={480} />
      <Bloom intensity={0.5} luminanceThreshold={0.75} luminanceSmoothing={0.25} mipmapBlur />
      <Vignette eskil={false} offset={0.28} darkness={0.42} />
    </EffectComposer>
  )
}
