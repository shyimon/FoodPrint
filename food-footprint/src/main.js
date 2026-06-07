import './style.css'
import { drawBarChart } from './charts/bar_chart.js'
import { initState, computeTotals } from './ui.js'

const response_avg = await fetch('/categories_avg.json')
const response_worst = await fetch('/categories_worst.json')
const presets = await fetch('/presets.json')

const data_avg = await response_avg.json()
const data_worst = await response_worst.json()
const data_presets = await presets.json()

const startingPreset = data_presets.presets.find(p => p.id === 'mediterranean')
const state = initState(data_avg, startingPreset)

console.log(state)

requestAnimationFrame(() => {
    drawBarChart(computeTotals(state), 'panel-ghg')
})