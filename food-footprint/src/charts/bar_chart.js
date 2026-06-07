import * as d3 from 'd3'

export function drawBarChart(data, containerId) {
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
    .attr('fill', '#4ade80')
    .on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .attr('fill', '#86efac')
        tooltip.innerHTML = `<strong>${d.category}</strong><br>${d.ghg.toFixed(2)} kg CO₂eq / week`
        tooltip.classList.remove('hidden')
    })
    .on('mousemove', (event) => {
        tooltip.style.left = (event.pageX + 12) + 'px'
        tooltip.style.top  = (event.pageY - 28) + 'px'
    })
    .on('mouseout', (event) => {
        d3.select(event.currentTarget)
          .attr('fill', '#4ade80')
        tooltip.classList.add('hidden')
    })
}