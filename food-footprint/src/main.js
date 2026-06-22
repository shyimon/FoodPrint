import './style.css'
import { drawBarChart } from './charts/bar_chart.js'
import { drawAnimalDeaths, startAnimation } from './charts/animal_deaths.js'
import { initState, computeTotals, renderTopBar, renderPresetSelector } from './ui.js'
import { drawWaterChart } from './charts/water_chart.js'
import { drawLandChart } from './charts/land_chart.js'
import { EAT_LANCET_WATER_GOAL } from './constants.js'
import { compute } from 'three/tsl'

const response_avg = await fetch('/categories_avg.json')
const response_worst = await fetch('/categories_worst.json')
const presets = await fetch('/presets.json')

const data_avg = await response_avg.json()
const data_worst = await response_worst.json()
const data_presets = await presets.json()

const countriesRes = await fetch('/countries.json')
const countriesData = await countriesRes.json()
const countries = countriesData.countries

const startingPreset = data_presets.presets.find(p => p.id === 'mediterranean')
const state = initState(data_avg, startingPreset)

const toggle = document.getElementById('data-mode-toggle')
const modeLabel = document.getElementById('data-mode-label')

toggle.addEventListener('change', () => {
    const isWorst = toggle.checked
    modeLabel.textContent = isWorst ? 'Worst Case' : 'Average'

    const newData = isWorst ? data_worst : data_avg
      state.forEach(d => {
    const match = newData.find(n => n.category === d.category)
    if (match) {
      d.ghg_per_kg = match.ghg_per_kg
      d.land_per_kg = match.land_per_kg
      d.water_per_kg = match.water_per_kg
    }
  })
  onStateChange()
})

requestAnimationFrame(() => {
  const totals = computeTotals(state)

  drawBarChart(totals)
  drawAnimalDeaths(totals)
  startAnimation()
  renderTopBar(state, onStateChange)
  drawWaterChart(totals)
  drawLandChart(totals, countries)
  renderPresetSelector(data_presets.presets, state, onStateChange)
})

function onStateChange() {
  const totals = computeTotals(state)

  drawBarChart(totals)
  drawWaterChart(totals)
  drawAnimalDeaths(totals)
  drawLandChart(totals, countries)
  renderTopBar(state, onStateChange)
}