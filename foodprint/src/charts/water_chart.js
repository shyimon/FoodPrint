import * as d3 from 'd3'
import { categoryColors } from '../colors.js'
import { EAT_LANCET_WATER_GOAL, WORLD_POPULATION_2050 } from '../constants.js'

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

  const totalWater = d3.sum(data, d => d.water)
  const maxVal = Math.max(totalWater, EAT_LANCET_WATER_GOAL * WORLD_POPULATION_2050 / 10)
  const scale = (height * 0.65) / maxVal

  const boxW = 50  // x width of box
  const boxD = 50  // z depth of box

  // centra il grafico
  let origin = { x: width - width / 3, y: height * 0.75 }

  let g = svg.append('g')
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

    // renderizzazione diversi lati del poligono
    segGroup.append('polygon')
      .attr('points', pointsToString([corners.C, corners.G, corners.F, corners.B]))
      .attr('fill', shadedColor(color, 1.1))
      .attr('stroke', 'none')

    segGroup.append('polygon')
      .attr('points', pointsToString([corners.E, corners.F, corners.G, corners.H]))
      .attr('fill', shadedColor(color, 1.1))
      .attr('stroke', 'none')

    segGroup.append('polygon')
      .attr('points', pointsToString([corners.D, corners.H, corners.G, corners.C]))
      .attr('fill', shadedColor(color, 0.8))
      .attr('stroke', 'none')

    // mostra informazioni on hover
    segGroup
      .on('mouseover', (event) => {
        segGroup.selectAll('polygon').attr('opacity', 0.75)
        tooltip.innerHTML = `<strong>${d.category}</strong><br>${(d.water / 1e9).toFixed(2)} km³ / day`
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

    currentHeight = y1
  })

    const yScale = d3.scaleLinear()
    .domain([0, maxVal * 1])
    .range([0, maxVal * scale])

    const ticks = yScale.ticks(5)

    ticks.forEach(tickVal => {
    const isoY = tickVal * scale + 25
    const tickPos = isoProject(0, isoY, 0)
    const tickEnd = isoProject(-10, isoY, 0)

    // ticks
    g.append('line')
        .attr('x1', tickPos.x).attr('y1', tickPos.y)
        .attr('x2', tickEnd.x).attr('y2', tickEnd.y)
        .attr('stroke', '#4b5563')
        .attr('stroke-width', 1)

    // Tick label
    g.append('text')
        .attr('x', tickEnd.x - 4)
        .attr('y', tickEnd.y + 63)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'central')
        .attr('fill', '#cccccc')
        .style('font-size', '12px')
        .text(d => tickVal != 0 ? `${(tickVal / 1e9).toFixed(0)}` : ' ')
    })

    // linea verticale
    const axisBot = isoProject(0, -38, 0)
    const axisTop = isoProject(0, maxVal * scale * 0.99, 0)
    g.append('line')
    .attr('x1', axisBot.x).attr('y1', axisBot.y)
    .attr('x2', axisTop.x).attr('y2', axisTop.y)
    .attr('stroke', '#4b5563')
    .attr('stroke-width', 1.5)

    // Y axis label
    const labelPos = isoProject(0, (maxVal * scale) + 10, 0)
    g.append('text')
    .attr('x', labelPos.x)
    .attr('y', labelPos.y)
    .attr('text-anchor', 'middle')
    .attr('fill', '#9ca3af')
    .style('font-size', '11px')
    .text('km³ of freshwater / day')

  // renderizzazione pilone rosso EAT-Lancet ---------------------------------------------------------------------------
  const EAT_svg = d3.select(`#${'panel-water'}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const goal_water = EAT_LANCET_WATER_GOAL * WORLD_POPULATION_2050 / 10

  // centra il grafico
  origin = { x: width / 4, y: height * 0.75 }

  g = svg.append('g')
    .attr('transform', `translate(${origin.x}, ${origin.y})`)

  const boxH = goal_water * scale
  const y0 = 0
  const y1 = boxH

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

    // renderizzazione diversi lati del poligono
    segGroup.append('polygon')
      .attr('points', pointsToString([corners.C, corners.G, corners.F, corners.B]))
      .attr('fill', shadedColor('#df2121', 1.1))
      .attr('stroke', 'none')

    segGroup.append('polygon')
      .attr('points', pointsToString([corners.E, corners.F, corners.G, corners.H]))
      .attr('fill', shadedColor('#df2121', 1.1))
      .attr('stroke', 'none')

    segGroup.append('polygon')
      .attr('points', pointsToString([corners.D, corners.H, corners.G, corners.C]))
      .attr('fill', shadedColor('#df2121', 0.8))
      .attr('stroke', 'none')

    // mostra informazioni on hover
    segGroup
      .on('mouseover', (event) => {
        segGroup.selectAll('polygon').attr('opacity', 0.75)
        tooltip.innerHTML = `<strong>EAT-Lancet Goal</strong><br>${goal_water.toFixed(2)} km³ / day`
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

    currentHeight = y1

}