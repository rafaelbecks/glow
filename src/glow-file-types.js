export const FILE_TYPE = {
  SCENE: 'scene',
  SET: 'set',
  LUMINODE: 'luminode'
}

export const GLOW_MIME = {
  SCENE: 'application/vnd.glow.scene+json',
  SET: 'application/vnd.glow.set+json',
  LUMINODE: 'application/vnd.glow.luminode+json'
}

export const GLOW_FILE_ACCEPT = {
  [GLOW_MIME.SCENE]: ['.glow'],
  [GLOW_MIME.SET]: ['.set.glow'],
  'application/json': ['.glow', '.set.glow']
}

export const GLOW_SET_FILE_ACCEPT = {
  [GLOW_MIME.SET]: ['.set.glow']
}

export const LUMINODE_FILE_ACCEPT = {
  [GLOW_MIME.LUMINODE]: ['.luminode'],
  'application/json': ['.luminode']
}

export function isSetFileName (fileName) {
  return fileName.endsWith('.set.glow')
}

export function isLuminodeFileName (fileName) {
  return typeof fileName === 'string' && fileName.endsWith('.luminode')
}

export function isGlowProjectFileName (fileName) {
  return typeof fileName === 'string' && fileName.endsWith('.glow')
}

export function detectGlowFileType (fileName, data) {
  if (data?.fileType === FILE_TYPE.SET) return FILE_TYPE.SET
  if (isSetFileName(fileName)) return FILE_TYPE.SET
  if (isLuminodeFileName(fileName) || data?.format === 'luminode') {
    return FILE_TYPE.LUMINODE
  }
  return FILE_TYPE.SCENE
}

export function stripGlowExtension (fileName) {
  if (fileName.endsWith('.set.glow')) {
    return fileName.slice(0, -'.set.glow'.length)
  }
  if (fileName.endsWith('.luminode')) {
    return fileName.slice(0, -'.luminode'.length)
  }
  if (fileName.endsWith('.glow')) {
    return fileName.slice(0, -'.glow'.length)
  }
  return fileName
}
