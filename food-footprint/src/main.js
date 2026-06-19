import './style.css'
import { drawBarChart } from './charts/bar_chart.js'
import { drawAnimalDeaths, startAnimation } from './charts/animal_deaths.js'
import { initState, computeTotals, renderTopBar, renderPresetSelector } from './ui.js'
import { drawWaterChart } from './charts/water_chart.js'
import { EAT_LANCET_WATER_GOAL } from './constants.js'

const response_avg = await fetch('/categories_avg.json')
const response_worst = await fetch('/categories_worst.json')
const presets = await fetch('/presets.json')

const data_avg = await response_avg.json()
const data_worst = await response_worst.json()
const data_presets = await presets.json()

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
    drawBarChart(computeTotals(state))
    drawAnimalDeaths(computeTotals(state))
    startAnimation()
    renderTopBar(state, onStateChange)
    drawWaterChart(computeTotals(state))
    renderPresetSelector(data_presets.presets, state, onStateChange)
})

function onStateChange() {
    drawBarChart(computeTotals(state))
    drawWaterChart(computeTotals(state))
    drawAnimalDeaths(computeTotals(state))
    renderTopBar(state, onStateChange)
}