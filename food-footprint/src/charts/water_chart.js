import * as d3 from 'd3'
import { categoryColors } from '../colors.js'
import { EAT_LANCET_WATER_GOAL } from '../constants.js'

// Isometric projection helpers
const ISO_ANGLE = Math.PI / 8
const cos = Math.cos(ISO_ANGLE)
const sin = Math.sin(ISO_ANGLE)

function isoProject(x, y, z) {
  return {
    x: (x - z) * cos,
    y: (x + z) * sin - y
  }
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function shadedColor(hex, factor) {
  const { r, g, b } = hexToRgb(hex)
  const shade = v => Math.max(0, Math.min(255, Math.round(v * factor)))
  return `rgb(${shade(r)}, ${shade(g)}, ${shade(b)})`
}

function pointsToString(pts) {
  return pts.map(p => `${p.x},${p.y}`).join(' ')
}

export function drawWaterChart(data) {
  const container = document.getElementById('panel-water')
  d3.select(`#${'panel-water'}`).selectAll('svg').remove()

  const width = container.clientWidth
  const height = container.clientHeight

  const svg = d3.select(`#${'panel-water'}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const tooltip = document.getElementById('tooltip-ghg')

  // Scale: map total water to box height units
  const totalWater = d3.sum(data, d => d.water)
  const maxVal = Math.max(totalWater, EAT_LANCET_WATER_GOAL)
  const scale = (height * 0.6) / maxVal

  const boxW = 100  // x width of box
  const boxD = 100  // z depth of box

  // Center the chart
  const origin = { x: width / 2, y: height * 0.7 }

  const g = svg.append('g')
    .attr('transform', `translate(${origin.x}, ${origin.y})`)

  data.sort((a, b) => b.water - a.water)

  let currentHeight = 0

  data.forEach(d => {
    if (d.water <= 0) return

    const boxH = d.water * scale
    const color = categoryColors[d.category]
    const y0 = currentHeight
    const y1 = currentHeight + boxH

    // 8 corners of the box in 3D (x, y, z)
    // y axis goes UP in our world space
    const corners = {
      // bottom face
      A: isoProject(0,    y0, 0),
      B: isoProject(boxW, y0, 0),
      C: isoProject(boxW, y0, boxD),
      D: isoProject(0,    y0, boxD),
      // top face
      E: isoProject(0,    y1, 0),
      F: isoProject(boxW, y1, 0),
      G: isoProject(boxW, y1, boxD),
      H: isoProject(0,    y1, boxD),
    }

    const segGroup = g.append('g').style('cursor', 'pointer')

    // Left face (darker)
    segGroup.append('polygon')
      .attr('points', pointsToString([corners.D, corners.H, corners.E, corners.A]))
      .attr('fill', shadedColor(color, 0.6))
      .attr('stroke', 'none')

    // Right face (medium)
    segGroup.append('polygon')
      .attr('points', pointsToString([corners.C, corners.G, corners.F, corners.B]))
      .attr('fill', shadedColor(color, 1.1))
      .attr('stroke', 'none')

    // Top face (lightest)
    segGroup.append('polygon')
      .attr('points', pointsToString([corners.E, corners.F, corners.G, corners.H]))
      .attr('fill', shadedColor(color, 1.1))
      .attr('stroke', 'none')

    // Top face (lightest)
    segGroup.append('polygon')
      .attr('points', pointsToString([corners.D, corners.H, corners.G, corners.C]))
      .attr('fill', shadedColor(color, 0.8))
      .attr('stroke', 'none')

    // Hover interaction
    segGroup
      .on('mouseover', (event) => {
        segGroup.selectAll('polygon').attr('opacity', 0.75)
        tooltip.innerHTML = `<strong>${d.category}</strong><br>${d.water.toFixed(0) / 1000 / 1000000}M cubic Tonnes / day`
        tooltip.classList.remove('hidden')
      })
      .on('mousemove', (event) => {
        tooltip.style.left = (event.pageX + 12) + 'px'
        tooltip.style.top = (event.pageY - 28) + 'px'
      })
      .on('mouseout', () => {
        segGroup.selectAll('polygon').attr('opacity', 1)
        tooltip.classList.add('hidden')
      })

    if (boxH > Infinity) { // vecchio codice per mostrare le label, infinity per non mostrarle mai
      const labelPos = isoProject(boxW, y0 + boxH / 2, boxD / 2)
      g.append('text')
        .attr('x', labelPos.x)
        .attr('y', labelPos.y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', 'white')
        .style('font-size', '10px')
        .style('pointer-events', 'none')
        .text(d.category)
    }

    currentHeight = y1
  })

  // EAT-Lancet reference plane
  const refH = EAT_LANCET_WATER_GOAL * scale
  const refCorners = {
    A: isoProject(-10,      refH, -10),
    B: isoProject(boxW + 10, refH, -10),
    C: isoProject(boxW + 10, refH, boxD + 10),
    D: isoProject(-10,      refH, boxD + 10),
  }

  g.append('polygon')
    .attr('points', pointsToString([refCorners.A, refCorners.B, refCorners.C, refCorners.D]))
    .attr('fill', '#df2121')
    .attr('opacity', 0.25)
    .attr('stroke', '#df2121')
    .attr('stroke-width', 1.5)

  // Reference label
  const labelPos = isoProject(boxW + 15, refH, boxD / 2)
  g.append('text')
    .attr('x', labelPos.x)
    .attr('y', labelPos.y)
    .attr('fill', '#df2121')
    .style('font-size', '10px')
    .text('EAT-Lancet target')

  // Y axis line
  const axisTop = isoProject(0, maxVal * scale * 1.1, 0)
  const axisBot = isoProject(0, 0, 0)
  g.append('line')
    .attr('x1', axisBot.x).attr('y1', axisBot.y)
    .attr('x2', axisTop.x).attr('y2', axisTop.y)
    .attr('stroke', '#4b5563')
    .attr('stroke-width', 1)
}