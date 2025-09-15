// Geometric shape detection utilities
// Based on classical mathematical algorithms and computer graphics techniques
//
// References:
// - Linear Regression: https://en.wikipedia.org/wiki/Linear_regression
// - Circumcircle: https://en.wikipedia.org/wiki/Circumcircle
// - Bounding Box: https://en.wikipedia.org/wiki/Minimum_bounding_box
// - Convex Hull: https://en.wikipedia.org/wiki/Convex_hull
// - Point-to-Line Distance: https://mathworld.wolfram.com/Point-LineDistance2-Dimensional.html

export class GeometricUtils {
  /**
   * Detect geometric shapes from a set of points
   * @param {Array} points - Array of {x, y} points
   * @param {Object} options - Detection options
   * @param {number} options.shapeDetectionThreshold - Confidence threshold (0-1)
   * @param {number} options.minPointsForShape - Minimum points required
   * @returns {Object|null} Detected shape or null
   */
  static detectGeometricShape (points, options = {}) {
    const { shapeDetectionThreshold = 0.8, minPointsForShape = 2 } = options

    if (points.length < minPointsForShape) return null

    // Only detect lines for now
    const line = this.detectLine(points, shapeDetectionThreshold)
    if (line && line.confidence >= shapeDetectionThreshold) return line

    return null
  }

  /**
   * Detect straight lines using least squares regression
   * Based on: https://en.wikipedia.org/wiki/Linear_regression
   * @param {Array} points - Array of {x, y} points
   * @param {number} threshold - Confidence threshold
   * @returns {Object|null} Line data or null
   */
  static detectLine (points, threshold = 0.8) {
    if (points.length < 2) return null

    // Calculate the line of best fit using least squares
    const n = points.length
    let sumX = 0; let sumY = 0; let sumXY = 0; let sumXX = 0

    for (const point of points) {
      sumX += point.x
      sumY += point.y
      sumXY += point.x * point.y
      sumXX += point.x * point.x
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared to measure how well the line fits
    let ssRes = 0; let ssTot = 0
    const meanY = sumY / n

    for (const point of points) {
      const predictedY = slope * point.x + intercept
      ssRes += Math.pow(point.y - predictedY, 2)
      ssTot += Math.pow(point.y - meanY, 2)
    }

    const rSquared = 1 - (ssRes / ssTot)
    const confidence = Math.max(0, rSquared)

    if (confidence >= threshold) {
      const startPoint = points[0]
      const endPoint = points[points.length - 1]
      return {
        type: 'line',
        start: startPoint,
        end: endPoint,
        slope,
        intercept,
        confidence
      }
    }

    return null
  }

  /**
   * Calculate distance between two points
   * @param {Object} p1 - First point {x, y}
   * @param {Object} p2 - Second point {x, y}
   * @returns {number} Euclidean distance
   */
  static distance (p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
  }

  /**
   * Calculate distance from a point to a line segment
   * Based on: https://mathworld.wolfram.com/Point-LineDistance2-Dimensional.html
   * @param {Object} point - Point {x, y}
   * @param {Object} lineStart - Line start point {x, y}
   * @param {Object} lineEnd - Line end point {x, y}
   * @returns {number} Distance to line
   */
  static distanceToLine (point, lineStart, lineEnd) {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D

    if (lenSq === 0) return this.distance(point, lineStart)

    const param = dot / lenSq

    let xx, yy
    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }

    return this.distance(point, { x: xx, y: yy })
  }

  /**
   * Render a geometric shape to a canvas context
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} stroke - Stroke object with geometricShape property
   */
  static renderGeometricShape (ctx, stroke) {
    if (!stroke.geometricShape) return

    const shape = stroke.geometricShape
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.lineWidth
    ctx.shadowColor = stroke.color
    ctx.shadowBlur = stroke.lineWidth * 0.5
    ctx.beginPath()

    // Only handle lines for now
    if (shape.type === 'line') {
      ctx.moveTo(shape.start.x, shape.start.y)
      ctx.lineTo(shape.end.x, shape.end.y)
    }

    ctx.stroke()
  }
}
