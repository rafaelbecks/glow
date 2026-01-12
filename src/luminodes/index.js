import { LissajousLuminode } from './lissajous.js'
import { HarmonographLuminode } from './harmonograph.js'
import { SphereLuminode } from './sphere.js'
import { GegoNetLuminode } from './gego-net.js'
import { GegoShapeLuminode } from './gego-shape.js'
import { SotoGridLuminode } from './soto-grid.js'
import { WhitneyLinesLuminode } from './whitney-lines.js'
import { PhyllotaxisLuminode } from './phyllotaxis.js'
import { MoireCirclesLuminode } from './moire-circles.js'
import { WovenNetLuminode } from './woven-net.js'
import { SinewaveLuminode } from './sinewave.js'
import { TriangleLuminode } from './triangle.js'
import { PolygonsLuminode } from './polygons.js'
import { NoiseValleyLuminode } from './noise-valley.js'
import { CatenoidLuminode } from './catenoid.js'
import { LineCylinderLuminode } from './cylinder.js'
import { ClaviluxLuminode } from './clavilux.js'
import { DiamondLuminode } from './diamond.js'
import { CubeLuminode } from './cube.js'
import { TrefoilKnotLuminode } from './trefoil.js'
import { SphericalLensLuminode } from './spherical-lens.js'
import { EpitrochoidLuminode } from './epitrochoid.js'
import { SyncHelix2DLuminode } from './sync-helix-2d.js'
import { RamielLuminode } from './ramiel.js'
import { WindmillLuminode } from './windmill.js'
import { OrizuruLuminode } from './orizuru.js'

export {
  LissajousLuminode,
  HarmonographLuminode,
  SphereLuminode,
  GegoNetLuminode,
  GegoShapeLuminode,
  SotoGridLuminode,
  WhitneyLinesLuminode,
  PhyllotaxisLuminode,
  MoireCirclesLuminode,
  WovenNetLuminode,
  SinewaveLuminode,
  TriangleLuminode,
  PolygonsLuminode,
  NoiseValleyLuminode,
  CatenoidLuminode,
  LineCylinderLuminode,
  ClaviluxLuminode,
  DiamondLuminode,
  CubeLuminode,
  TrefoilKnotLuminode,
  SphericalLensLuminode,
  EpitrochoidLuminode,
  SyncHelix2DLuminode,
  RamielLuminode,
  WindmillLuminode,
  OrizuruLuminode
}

export const LUMINODE_REGISTRY = {
  lissajous: {
    class: LissajousLuminode,
    displayName: 'Lissajous',
    settingsKey: 'LISSAJOUS'
  },
  harmonograph: {
    class: HarmonographLuminode,
    displayName: 'Harmonograph',
    settingsKey: 'HARMONOGRAPH'
  },
  sphere: {
    class: SphereLuminode,
    displayName: 'Sphere',
    settingsKey: 'SPHERE'
  },
  gegoNet: {
    class: GegoNetLuminode,
    displayName: 'Gego Net',
    settingsKey: 'GEGO_NET'
  },
  gegoShape: {
    class: GegoShapeLuminode,
    displayName: 'Gego Shape',
    settingsKey: 'GEGO_SHAPE'
  },
  sotoGrid: {
    class: SotoGridLuminode,
    displayName: 'Soto Grid',
    settingsKey: 'SOTO_GRID'
  },
  sotoGridRotated: {
    class: SotoGridLuminode,
    displayName: 'Soto Squares',
    settingsKey: 'SOTO_GRID'
  },
  whitneyLines: {
    class: WhitneyLinesLuminode,
    displayName: 'Whitney Lines',
    settingsKey: 'WHITNEY_LINES'
  },
  phyllotaxis: {
    class: PhyllotaxisLuminode,
    displayName: 'Phyllotaxis',
    settingsKey: 'PHYLLOTAXIS'
  },
  moireCircles: {
    class: MoireCirclesLuminode,
    displayName: 'Moire Circles',
    settingsKey: 'MOIRE_CIRCLES'
  },
  wovenNet: {
    class: WovenNetLuminode,
    displayName: 'Woven Net',
    settingsKey: 'WOVEN_NET'
  },
  sinewave: {
    class: SinewaveLuminode,
    displayName: 'Sine Wave',
    settingsKey: 'SINEWAVE'
  },
  triangle: {
    class: TriangleLuminode,
    displayName: 'Triangle',
    settingsKey: 'TRIANGLE'
  },
  polygons: {
    class: PolygonsLuminode,
    displayName: 'Polygons',
    settingsKey: 'POLYGONS'
  },
  noiseValley: {
    class: NoiseValleyLuminode,
    displayName: 'Noise Valley',
    settingsKey: 'NOISE_VALLEY'
  },
  catenoid: {
    class: CatenoidLuminode,
    displayName: 'Catenoid',
    settingsKey: 'CATENOID'
  },
  lineCylinder: {
    class: LineCylinderLuminode,
    displayName: 'Line Cylinder',
    settingsKey: 'LINE_CYLINDER'
  },
  clavilux: {
    class: ClaviluxLuminode,
    displayName: 'Clavilux',
    settingsKey: 'CLAVILUX'
  },
  diamond: {
    class: DiamondLuminode,
    displayName: 'Diamond',
    settingsKey: 'DIAMOND'
  },
  cube: {
    class: CubeLuminode,
    displayName: 'Cube',
    settingsKey: 'CUBE'
  },
  trefoil: {
    class: TrefoilKnotLuminode,
    displayName: 'Trefoil Knot',
    settingsKey: 'TREFOIL'
  },
  sphericalLens: {
    class: SphericalLensLuminode,
    displayName: 'Spherical Lens',
    settingsKey: 'SPHERICAL_LENS'
  },
  epitrochoid: {
    class: EpitrochoidLuminode,
    displayName: 'Epitrochoid',
    settingsKey: 'EPITROCHOID'
  },
  syncHelix2D: {
    class: SyncHelix2DLuminode,
    displayName: 'Sync Helix',
    settingsKey: 'SYNC_HELIX_2D'
  },
  ramiel: {
    class: RamielLuminode,
    displayName: 'Ramiel',
    settingsKey: 'RAMIEL'
  },
  windmill: {
    class: WindmillLuminode,
    displayName: 'Windmill',
    settingsKey: 'WINDMILL'
  },
  orizuru: {
    class: OrizuruLuminode,
    displayName: 'Orizuru',
    settingsKey: 'ORIZURU'
  }
}

export function getLuminodeClass (name) {
  return LUMINODE_REGISTRY[name]?.class
}

export function getLuminodeDisplayName (name) {
  return LUMINODE_REGISTRY[name]?.displayName || name
}

export function getLuminodeSettingsKey (name) {
  return LUMINODE_REGISTRY[name]?.settingsKey || name.toUpperCase()
}

export function getAvailableLuminodes () {
  return Object.keys(LUMINODE_REGISTRY)
}
