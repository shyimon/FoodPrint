import * as d3 from 'd3'
import { categoryColors, categoryColorsHover } from '../colors'
import { EAT_LANCET_GHG_GOAL } from '../constants' // espresso in milioni di tonnellate per giorno

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

  data.sort((a, b) => b.ghg - a.ghg) // il cibo con il maggior contributo è alla base dello stack
  const keys = data.map(d => d.category)
  const stackData = [Object.fromEntries(data.map(d => [d.category, d.ghg]))]

  const stack = d3.stack().keys(keys)
  const series = stack(stackData)

  const totalGHG = d3.sum(data, d => d.ghg)
  const maxY = Math.max(totalGHG, EAT_LANCET_GHG_GOAL) * 1.05
  const y = d3.scaleLinear()
    .domain([0, maxY])
    .range([innerHeight, 0])

  // barra verticale da poi dividere
  const barWidth = innerWidth * 0.75
  const barX = (innerWidth - barWidth) / 2 // per centrare la barra sul div

  // hover per mostrare informazioni aggiuntive
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
        .on('mouseover', (event) => { // on hover mostra informazioni più dettagliate
          d3.select(event.currentTarget).attr('opacity', 0.8)
          tooltip.innerHTML = `<strong>${category}</strong><br>${(segment[1] - segment[0]).toFixed(2)} Tonnes of CO₂eq / day`
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

      // se la grandezza della barra lo permette, mostra il nome del cibo
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
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d === 0 ? '0' : `${d}M`))
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
    .text('Tonnes of CO₂eq / day')

  // linea rossa eat-lancet
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
    tooltip.textContent = 'Greenhouse gas emissions are measured in Gigatonnes (one Gt is one billion tonnes) of carbon dioxide-equivalents. This means non-CO₂ gases are weighted by theamount of warming they cause over a 100-year timescale.'
    tooltip.textContent += ' The red line shows the emissions goal proposed by the EAT-Lancet Commission for 2050 in the Planetary Health Diet Report.'
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