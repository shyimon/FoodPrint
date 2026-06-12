import * as d3 from 'd3'
import { categoryColors, categoryColorsHover } from '../colors'
import { EAT_LANCET_GHG_GOAL } from '../constants'

export function drawBarChart(data, containerId) {
  const container = document.getElementById(containerId)
  d3.select(`#${containerId}`).selectAll('svg').remove() 

  const width = container.clientWidth
  const height = container.clientHeight
  const margin = { top: 20, right: 30, bottom: 100, left: 50 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  data.sort((a, b) => b.ghg - a.ghg)
  const keys = data.map(d => d.category)
  const stackData = [Object.fromEntries(data.map(d => [d.category, d.ghg]))]

  const stack = d3.stack().keys(keys)
  const series = stack(stackData)

  const totalGHG = d3.sum(data, d => d.ghg)
  const maxY = Math.max(totalGHG, EAT_LANCET_GHG_GOAL) * 1.05
  const y = d3.scaleLinear()
    .domain([0, maxY])
    .range([innerHeight, 0])

  // Bar width — single wide bar
  const barWidth = innerWidth * 0.8
  const barX = (innerWidth - barWidth) / 2

  // Tooltip
  const tooltip = document.getElementById('tooltip-ghg')

  // Draw segments
  g.selectAll('g.layer')
    .data(series)
    .join('g')
    .attr('class', 'layer')
    .each(function(d) {
      const segment = d[0] // only one bar
      const segHeight = y(segment[0]) - y(segment[1])
      const segY = y(segment[1])
      const category = d.key

      // Rectangle
      d3.select(this).append('rect')
        .attr('x', barX)
        .attr('y', segY)
        .attr('width', barWidth)
        .attr('height', segHeight)
        .attr('fill', categoryColors[category])
        .on('mouseover', (event) => {
          d3.select(event.currentTarget).attr('opacity', 0.8)
          tooltip.innerHTML = `<strong>${category}</strong><br>${(segment[1] - segment[0]).toFixed(2)} kg CO₂eq / week`
          tooltip.classList.remove('hidden')
        })
        .on('mousemove', (event) => {
          tooltip.style.left = (event.pageX + 12) + 'px'
          tooltip.style.top = (event.pageY - 28) + 'px'
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget).attr('opacity', 1)
          tooltip.classList.add('hidden')
        })

      // Label — only if segment is tall enough
      if (segHeight > 20) {
        d3.select(this).append('text')
          .attr('x', barX + barWidth / 2)
          .attr('y', segY + segHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', 'white')
          .style('font-size', '11px')
          .style('pointer-events', 'none')
          .text(category)
      }
    })

  // Y axis
  g.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line')
      .attr('x2', innerWidth)
      .attr('stroke', '#374151')
      .attr('stroke-dasharray', '4,2'))
    .call(g => g.selectAll('.tick text')
      .attr('fill', '#9ca3af')
      .attr('x', -10))

  // Y axis label
  svg.append('text')
    .attr('transform', `translate(14, ${margin.top + innerHeight / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .attr('fill', '#9ca3af')
    .style('font-size', '11px')
    .text('kg CO₂eq / week')

  // EAT-Lancet reference line
  g.append('line')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', y(EAT_LANCET_GHG_GOAL))
    .attr('y2', y(EAT_LANCET_GHG_GOAL))
    .attr('stroke', '#df2121')
    .attr('stroke-width', 3)
    .attr('stroke-dasharray', '6,3')

const tooltipTrigger = svg.append('g')
  .attr('transform', `translate(${margin.left - 39}, ${margin.top + 190})`)
  .style('cursor', 'pointer')

tooltipTrigger.append('circle')
  .attr('r', 8)
  .attr('fill', '#374151')
  .attr('stroke', '#6b7280')

tooltipTrigger.append('text')
  .attr('text-anchor', 'middle')
  .attr('dominant-baseline', 'central')
  .attr('fill', '#9ca3af')
  .style('font-size', '11px')
  .text('?')

tooltipTrigger
  .on('mouseover', () => {
    tooltip.textContent = 'Greenhouse gas emissions are measured in kilograms of carbon dioxide-equivalents. This means non-CO₂ gases are weighted by theamount of warming they cause over a 100-year timescale.'
    tooltip.textContent += 'The red line shows the emissions goal proposed by the EAT-Lancet Commission for 2050 in the Planetary Health Diet Report.'
    tooltip.classList.remove('hidden')
  })
  .on('mousemove', (event) => {
    tooltip.style.left = (event.pageX + 12) + 'px'
    tooltip.style.top = (event.pageY - 28) + 'px'
  })
  .on('mouseout', () => {
    tooltip.classList.add('hidden')
  })
}

export function oldDrawBarChart(data, containerId) {
  const container = document.getElementById(containerId)
  const width = container.clientWidth
  const height = container.clientHeight

  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const margin = { top: 20, right: 30, bottom: 100, left: 50 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // X scale — one band per category
  const x = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([0, innerWidth])
    .padding(0.3)

  // Y scale — from 0 to max GHG value
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.ghg)])
    .range([innerHeight, 0])

  // X axis
  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')

  // Y axis
  g.append('g')
    .call(d3.axisLeft(y))

  // Bars
  g.selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', d => x(d.category))
    .attr('y', d => y(d.ghg))
    .attr('width', x.bandwidth())
    .attr('height', d => innerHeight - y(d.ghg))
    .attr('fill', '#4ade80')

// additional info for ghg emissions
const labelGroup = svg.append('g')
    .attr('transform', `translate(15, ${margin.top + innerHeight / 2})`)

labelGroup.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .attr('fill', '#9ca3af')
    .style('font-size', '12px')
    .text('GHG Emissions')

const tooltipTrigger = svg.append('g')
  .attr('transform', `translate(12, ${margin.top + innerHeight / 2 - 60})`)
  .style('cursor', 'pointer')

tooltipTrigger.append('circle')
  .attr('r', 8)
  .attr('fill', '#374151')
  .attr('stroke', '#6b7280')

tooltipTrigger.append('text')
  .attr('text-anchor', 'middle')
  .attr('dominant-baseline', 'central')
  .attr('fill', '#9ca3af')
  .style('font-size', '11px')
  .text('?')

const tooltip = document.getElementById('tooltip-ghg')

tooltipTrigger
  .on('mouseover', (event) => {
    tooltip.textContent = 'Greenhouse gas emissions are measured in kilograms of carbon dioxide-equivalents. This means non-CO₂ gases are weighted by the amount of warming they cause over a 100-year timescale.'
    tooltip.classList.remove('hidden')
  })
  .on('mousemove', (event) => {
    tooltip.style.left = (event.pageX + 12) + 'px'
    tooltip.style.top  = (event.pageY - 28) + 'px'
  })
  .on('mouseout', () => {
    tooltip.classList.add('hidden')
  })

  g.selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', d => x(d.category))
    .attr('y', d => y(d.ghg))
    .attr('width', x.bandwidth())
    .attr('height', d => innerHeight - y(d.ghg))
    .attr('fill', d => categoryColors[d.category])
    .on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .attr('fill', d => categoryColorsHover[d.category])
        tooltip.innerHTML = `<strong>${d.category}</strong><br>${d.ghg.toFixed(2)} kg CO₂eq / week`
        tooltip.classList.remove('hidden')
    })
    .on('mousemove', (event) => {
        tooltip.style.left = (event.pageX + 12) + 'px'
        tooltip.style.top  = (event.pageY - 24) + 'px'
    })
    .on('mouseout', (event) => {
        d3.select(event.currentTarget)
          .attr('fill', d => categoryColors[d.category])
        tooltip.classList.add('hidden')
    })
}