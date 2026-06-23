import { WORLD_POPULATION_2050, EAT_LANCET_LAND_GOAL } from '../constants.js'

let selectedCountry = null
let svgCache = {}

async function fetchSVG(url) {
  if (svgCache[url]) return svgCache[url]
  const res = await fetch(url)
  const text = await res.text()
  const clean = text.slice(text.indexOf('<svg'))
  svgCache[url] = clean
  return clean
}

export async function drawLandChart(data, countries) {
  const container = document.getElementById('panel-land')
  container.innerHTML = ''

  // Total land use in km² (global)
  const totalLand = data.reduce((sum, d) => sum + d.land, 0)

  // Default to first country if none selected
  if (!selectedCountry) selectedCountry = countries[0]

  const times = totalLand / selectedCountry.area_km2
  const fullCount = Math.floor(times)
  const partial = times - fullCount

  const EAT_LANCET_times = EAT_LANCET_LAND_GOAL / selectedCountry.area_km2
  const EAT_LANCET_fullCount = Math.floor(EAT_LANCET_times)
  const EAT_LANCET_partial = EAT_LANCET_times > times ? 1 - partial : 0

  // --- HEADER ---
  const header = document.createElement('div')
  header.className = 'flex items-center gap-3 mb-3 flex-shrink-0'
  header.innerHTML = `
    <div class="flex flex-col">
      <span class="text-white font-medium"> Land consumption is ${(totalLand).toLocaleString()} km²</span>
      <span class="text-gray-400 text-sm">
        or <strong class="text-white">${times.toFixed(1)} times</strong>
        <select id="country-selector" class="bg-gray-900 border border-gray-600 rounded px-2 py-0.5 text-white text-sm focus:outline-none ml-1">
          ${countries.map(c => `<option value="${c.id}" ${c.id === selectedCountry.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </span>
    </div>
  `
  container.appendChild(header)

  // Country selector interaction
  header.querySelector('#country-selector').addEventListener('change', (e) => {
    selectedCountry = countries.find(c => c.id === e.target.value)
    drawLandChart(data, countries)
  })

  // --- SILHOUETTE GRID ---
  const grid = document.createElement('div')
  grid.className = 'flex flex-wrap flex-1'
  container.appendChild(grid)

  // Preload SVG
  const svgContent = await fetchSVG(selectedCountry.silhouette)

  // Fixed display size based on country area — scale relative to a reference
  const REFERENCE_AREA = 301340 // Italy as baseline
  const BASE_SIZE = 30
  const size = BASE_SIZE * Math.sqrt(selectedCountry.area_km2 / REFERENCE_AREA)

  function makeSilhouette(fillColor, opacity, maskPercent = null, showRedLine = false, redLineX = null) {
  const vb = new DOMParser().parseFromString(svgContent, 'image/svg+xml')
    .documentElement.getAttribute('viewBox')?.split(' ')
  const vbW = vb ? parseFloat(vb[2]) : size
  const vbH = vb ? parseFloat(vb[3]) : size
  const aspect = vbW / vbH

  const wrapper = document.createElement('div')
  wrapper.style.position = 'relative'
  wrapper.style.width = `${size * aspect}px`
  wrapper.style.height = `${size}px`
  wrapper.style.flexShrink = '0'

  if (maskPercent !== null) {
    wrapper.style.webkitMaskImage = `linear-gradient(to right, black ${maskPercent * 100}%, transparent ${maskPercent * 100}%)`
    wrapper.style.maskImage = `linear-gradient(to right, black ${maskPercent * 100}%, transparent ${maskPercent * 100}%)`
  }

  wrapper.innerHTML = svgContent
  const svg = wrapper.querySelector('svg')
  if (svg) {
    svg.setAttribute('width', size * aspect)
    svg.setAttribute('height', size)
    svg.style.fill = fillColor
    svg.style.display = 'block'
    svg.querySelectorAll('path, polygon, rect, circle').forEach(el => {
      el.setAttribute('fill', fillColor)
      el.style.opacity = opacity
    })
  }

  return wrapper
}

  const maxCount = Math.ceil(Math.max(times,EAT_LANCET_times))

  for (let i = 0; i < maxCount; i++) {
    const isWithinGoal = i < EAT_LANCET_fullCount || (i === EAT_LANCET_fullCount && partial <= EAT_LANCET_partial)
    const isActual = i < fullCount
    const isPartial = i === fullCount && partial > 0
    const isEatLine = i === EAT_LANCET_fullCount

    let fillColor = isWithinGoal ? '#4ade80' : '#ef4444'
    let maskPercent = null

    if (isPartial) maskPercent = partial
    if (!isActual && !isPartial) continue // don't render beyond actual diet

    const el = makeSilhouette(fillColor, '1', maskPercent, isEatLine, EAT_LANCET_partial)
    grid.appendChild(el)
  }
}