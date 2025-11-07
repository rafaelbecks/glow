export function logStateDiff (savedState, currentState) {
  console.group('🔍 Unsaved Changes Detected')

  const diff = deepDiff(savedState, currentState)
  if (Object.keys(diff).length === 0) {
    console.log('No differences found (but strings differ - might be property order)')
  } else {
    console.log('Differences:', diff)
  }

  console.log('Saved state keys:', Object.keys(savedState))
  console.log('Current state keys:', Object.keys(currentState))
  console.groupEnd()
}

function deepDiff (obj1, obj2, path = '') {
  const diff = {}

  const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})])

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key
    const val1 = obj1?.[key]
    const val2 = obj2?.[key]

    if (val1 === undefined && val2 !== undefined) {
      diff[currentPath] = { type: 'added', value: val2 }
    } else if (val1 !== undefined && val2 === undefined) {
      diff[currentPath] = { type: 'removed', value: val1 }
    } else if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null && !Array.isArray(val1) && !Array.isArray(val2)) {
      const nestedDiff = deepDiff(val1, val2, currentPath)
      Object.assign(diff, nestedDiff)
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      diff[currentPath] = {
        type: 'changed',
        old: val1,
        new: val2
      }
    }
  }

  return diff
}
