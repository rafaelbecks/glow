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
    const { shapeDetectionThreshold = 0.8, minPointsForShape = 3 } = options

    if (points.length < minPointsForShape) return null

    // Try to detect different shapes in order of preference
    const line = this.detectLine(points, shapeDetectionThreshold)
    if (line && line.confidence >= shapeDetectionThreshold) return line

    const circle = this.detectCircle(points, shapeDetectionThreshold)
    if (circle && circle.confidence >= shapeDetectionThreshold) return circle

    const rectangle = this.detectRectangle(points, shapeDetectionThreshold)
    if (rectangle && rectangle.confidence >= shapeDetectionThreshold) return rectangle

    const triangle = this.detectTriangle(points, shapeDetectionThreshold)
    if (triangle && triangle.confidence >= shapeDetectionThreshold) return triangle

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
   * Detect circles using three-point circumcircle method
   * Based on: https://en.wikipedia.org/wiki/Circumcircle
   * @param {Array} points - Array of {x, y} points
   * @param {number} threshold - Confidence threshold
   * @returns {Object|null} Circle data or null
   */
  static detectCircle (points, threshold = 0.8) {
    if (points.length < 3) return null

    // Use the first, middle, and last points to estimate circle
    const n = points.length
    const p1 = points[0]
    const p2 = points[Math.floor(n / 2)]
    const p3 = points[n - 1]

    // Calculate circle center and radius using three points
    const A = p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)
    if (Math.abs(A) < 1e-10) return null // Points are collinear

    const B = (p1.x * p1.x + p1.y * p1.y) * (p3.y - p2.y) +
              (p2.x * p2.x + p2.y * p2.y) * (p1.y - p3.y) +
              (p3.x * p3.x + p3.y * p3.y) * (p2.y - p1.y)

    const C = (p1.x * p1.x + p1.y * p1.y) * (p2.x - p3.x) +
              (p2.x * p2.x + p2.y * p2.y) * (p3.x - p1.x) +
              (p3.x * p3.x + p3.y * p3.y) * (p1.x - p2.x)

    const centerX = B / (2 * A)
    const centerY = C / (2 * A)
    const radius = Math.sqrt((p1.x - centerX) ** 2 + (p1.y - centerY) ** 2)

    // Calculate confidence based on how close all points are to the circle
    let totalError = 0
    for (const point of points) {
      const distance = Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2)
      totalError += Math.abs(distance - radius)
    }

    const avgError = totalError / points.length
    const confidence = Math.max(0, 1 - (avgError / radius))

    if (confidence >= threshold) {
      return {
        type: 'circle',
        center: { x: centerX, y: centerY },
        radius,
        confidence
      }
    }

    return null
  }

  /**
   * Detect rectangles using bounding box analysis
   * Based on: https://en.wikipedia.org/wiki/Minimum_bounding_box
   * @param {Array} points - Array of {x, y} points
   * @param {number} threshold - Confidence threshold
   * @returns {Object|null} Rectangle data or null
   */
  static detectRectangle (points, threshold = 0.8) {
    if (points.length < 4) return null

    // Find bounding box
    let minX = points[0].x; let maxX = points[0].x
    let minY = points[0].y; let maxY = points[0].y

    for (const point of points) {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    }

    const width = maxX - minX
    const height = maxY - minY
    const aspectRatio = Math.min(width, height) / Math.max(width, height)

    // Check if points are close to rectangle edges
    let pointsOnEdges = 0
    const tolerance = Math.min(width, height) * 0.1 // 10% tolerance

    for (const point of points) {
      const distToLeft = Math.abs(point.x - minX)
      const distToRight = Math.abs(point.x - maxX)
      const distToTop = Math.abs(point.y - minY)
      const distToBottom = Math.abs(point.y - maxY)

      if (distToLeft < tolerance || distToRight < tolerance ||
          distToTop < tolerance || distToBottom < tolerance) {
        pointsOnEdges++
      }
    }

    const confidence = (pointsOnEdges / points.length) * aspectRatio

    if (confidence >= threshold) {
      return {
        type: 'rectangle',
        x: minX,
        y: minY,
        width,
        height,
        confidence
      }
    }

    return null
  }

  /**
   * Detect triangles using extreme point analysis
   * Based on: https://en.wikipedia.org/wiki/Convex_hull
   * @param {Array} points - Array of {x, y} points
   * @param {number} threshold - Confidence threshold
   * @returns {Object|null} Triangle data or null
   */
  static detectTriangle (points, threshold = 0.8) {
    if (points.length < 3) return null

    // Find the three most extreme points (furthest apart)
    let maxDist = 0
    let p1 = points[0]; let p2 = points[0]; let p3 = points[0]

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        for (let k = j + 1; k < points.length; k++) {
          const dist1 = this.distance(points[i], points[j])
          const dist2 = this.distance(points[j], points[k])
          const dist3 = this.distance(points[k], points[i])
          const totalDist = dist1 + dist2 + dist3

          if (totalDist > maxDist) {
            maxDist = totalDist
            p1 = points[i]
            p2 = points[j]
            p3 = points[k]
          }
        }
      }
    }

    // Calculate how many points are close to the triangle edges
    let pointsOnEdges = 0
    const tolerance = Math.min(maxDist / 3, 20) // Dynamic tolerance

    for (const point of points) {
      const distToEdge1 = this.distanceToLine(point, p1, p2)
      const distToEdge2 = this.distanceToLine(point, p2, p3)
      const distToEdge3 = this.distanceToLine(point, p3, p1)

      if (Math.min(distToEdge1, distToEdge2, distToEdge3) < tolerance) {
        pointsOnEdges++
      }
    }

    const confidence = pointsOnEdges / points.length

    if (confidence >= threshold) {
      return {
        type: 'triangle',
        p1,
        p2,
        p3,
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

    switch (shape.type) {
      case 'line':
        ctx.moveTo(shape.start.x, shape.start.y)
        ctx.lineTo(shape.end.x, shape.end.y)
        break

      case 'circle':
        ctx.arc(shape.center.x, shape.center.y, shape.radius, 0, 2 * Math.PI)
        break

      case 'rectangle':
        ctx.rect(shape.x, shape.y, shape.width, shape.height)
        break

      case 'triangle':
        ctx.moveTo(shape.p1.x, shape.p1.y)
        ctx.lineTo(shape.p2.x, shape.p2.y)
        ctx.lineTo(shape.p3.x, shape.p3.y)
        ctx.closePath()
        break
    }

    ctx.stroke()
  }
}
