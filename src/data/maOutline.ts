// Stylized low-poly Massachusetts outline shared by the 3D hero map and the
// 2D SVG coverage map. Coordinate space: x -3.5..3.4 (west→east),
// y -0.95..0.95 (south→north).
export const MA_OUTLINE: readonly [number, number][] = [
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

/** Project outline coordinates into SVG space (viewBox 0 0 710 180). */
export function toSvg(x: number, y: number): [number, number] {
  return [(x + 3.6) * 100, (0.95 - y) * 100]
}

export const MA_SVG_PATH =
  'M' + MA_OUTLINE.map(([x, y]) => toSvg(x, y).map((n) => n.toFixed(1)).join(',')).join(' L') + ' Z'
