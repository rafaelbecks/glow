export function getEulerRotation (moduleSettings) {
  const rotation = moduleSettings?.ROTATION || { x: 0, y: 0, z: 0 }
  const x = typeof rotation.x === 'number' ? rotation.x : 0
  const y = typeof rotation.y === 'number' ? rotation.y : 0
  const z = typeof rotation.z === 'number' ? rotation.z : 0

  const degToRad = Math.PI / 180

  return {
    x: x * degToRad,
    y: y * degToRad,
    z: z * degToRad
  }
}

export function isRotationEnabled (moduleSettings) {
  if (!moduleSettings) return false
  if (moduleSettings.ROTATION_ENABLED === undefined) return true
  return Boolean(moduleSettings.ROTATION_ENABLED)
}

