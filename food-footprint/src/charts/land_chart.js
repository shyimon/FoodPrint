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

  // Full silhouettes
  for (let i = 0; i < fullCount; i++) {
    const el = document.createElement('div')
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    el.innerHTML = svgContent
    const svg = el.querySelector('svg')
    if (svg) {
      svg.setAttribute('width', size)
      svg.setAttribute('height', size)
      svg.style.fill = '#4ade80'
    }
    grid.appendChild(el)
  }

  // Partial silhouette — clipped with CSS mask
  if (partial > 0) {
    const el = document.createElement('div')
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    el.style.flexShrink = '0'
    el.style.webkitMaskImage = `linear-gradient(to right, black ${partial * 100}%, transparent ${partial * 100}%)`
    el.style.maskImage = `linear-gradient(to right, black ${partial * 100}%, transparent ${partial * 100}%)`
    el.innerHTML = svgContent
    const svg = el.querySelector('svg')
    if (svg) {
      svg.setAttribute('width', size)
      svg.setAttribute('height', size)
      svg.style.fill = '#4ade80'
    }
    grid.appendChild(el)
  }
}