import { ANIMAL_DEATHS_PER_KG, WORLD_POPULATION_2050, SECONDS_PER_DAY } from '../constants.js'

const pigProportion = 10
const cowProportion = 10
const chickenProportion = 10

const cowRowSize = 1
const pigRowSize = 5
const chickenRowSize = 10

const LANES = [
  { id: 'cow',     emoji: '🐮'.repeat(cowRowSize), label: `1 icon = ${cowProportion} dead Cows`,     proportion: cowProportion  },   
  { id: 'pig',     emoji: '🐷'.repeat(pigRowSize), label: `1 icon = ${pigProportion} dead Pigs`,     proportion: pigProportion },  
  { id: 'chicken', emoji: '🐔'.repeat(chickenRowSize), label: `1 icon = ${chickenProportion} dead Chickens`, proportion: chickenProportion },  
]

export function computeDeathRates(totals) {
  const beef_lamb  = totals.find(d => d.category === 'Beef & Lamb')?.grams_per_day ?? 0
  const pork       = totals.find(d => d.category === 'Pork')?.grams_per_day ?? 0
  const poultry    = totals.find(d => d.category === 'Poultry')?.grams_per_day ?? 0
  const eggs       = totals.find(d => d.category === 'Eggs')?.grams_per_day ?? 0
  const dairy      = totals.find(d => d.category === 'Dairy')?.grams_per_day ?? 0

  const cowDeaths      = (ANIMAL_DEATHS_PER_KG.beef    * beef_lamb / 1000 * WORLD_POPULATION_2050) / SECONDS_PER_DAY
  const pigDeaths      = (ANIMAL_DEATHS_PER_KG.pork    * pork      / 1000 * WORLD_POPULATION_2050) / SECONDS_PER_DAY
  const chickenDeaths  = (
    (ANIMAL_DEATHS_PER_KG.chicken    * poultry / 1000) +
    (ANIMAL_DEATHS_PER_KG.eggs_dairy * eggs    / 1000) +
    (ANIMAL_DEATHS_PER_KG.eggs_dairy * dairy   / 1000)
  ) * WORLD_POPULATION_2050 / SECONDS_PER_DAY

  return { cow: cowDeaths / cowRowSize, pig: pigDeaths / pigRowSize, chicken: chickenDeaths / chickenRowSize }
}

let animationId = null
let laneStates = {}

export function drawAnimalDeaths(totals) {
  const rates = computeDeathRates(totals)
  const container = document.getElementById('panel-deaths')

  // First call — build DOM
  if (!container.querySelector('.animal-lanes')) {
    container.innerHTML = `<div class="animal-lanes flex h-full w-full relative"></div>`

    LANES.forEach(lane => {
      const col = document.createElement('div')
      col.className = 'flex-1 flex flex-col items-center relative border-r border-gray-800 last:border-r-0'
      col.innerHTML = `
        <span class="text-xs text-gray-400 py-2 z-10">${lane.label}</span>
        <div class="lane-icons relative flex-1 w-full" id="lane-${lane.id}"></div>
      `

      // Hover overlay per lane
      const overlay = document.createElement('div')
      overlay.className = 'absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-20 z-30 pointer-events-none rounded'
      overlay.innerHTML = `
        <span class="text-white text-2xs text-center px-2">
          1 emoji = <strong>${lane.proportion}</strong> dead ${lane.label.toLowerCase()}<br>
          <span class="text-gray-300">figures are in real time</span>
        </span>
      `
      col.appendChild(overlay)
      col.style.pointerEvents = 'auto'

      container.querySelector('.animal-lanes').appendChild(col)
    })
  }

  // Update lane rates
  LANES.forEach(lane => {
    laneStates[lane.id] = {
      rate:        rates[lane.id] / lane.proportion, // emojis per second
      realRate:    rates[lane.id],                   // actual animals per second
      accumulator: laneStates[lane.id]?.accumulator ?? 0,
      lastTime:    laneStates[lane.id]?.lastTime ?? performance.now(),
    }
  })
}

export function startAnimation() {
  if (animationId) cancelAnimationFrame(animationId)

  function tick(now) {
    LANES.forEach(lane => {
      const ls = laneStates[lane.id]
      if (!ls) return

      const elapsed = (now - ls.lastTime) / 1000
      ls.lastTime = now
      ls.accumulator += ls.rate * elapsed // no cap — proportion handles performance

      const laneEl = document.getElementById(`lane-${lane.id}`)
      if (!laneEl) return

      while (ls.accumulator >= 1) {
        ls.accumulator -= 1
        spawnEmoji(laneEl, lane.emoji)
      }
    })

    animationId = requestAnimationFrame(tick)
  }

  animationId = requestAnimationFrame(tick)
}

function spawnEmoji(laneEl, emoji) {
  const el = document.createElement('div')
  el.className = 'animal-icon absolute'
  if(emoji == "🐔".repeat(chickenRowSize)) {
    el.style.fontSize = '8px'
  } else if (emoji == '🐮'.repeat(cowRowSize)) {  
    el.style.fontSize = '50px'
  }
  else {
    el.style.fontSize = '15px'
  }
  el.style.left = `calc(10%)`
  el.style.top = `0px`
  el.textContent = emoji

  laneEl.appendChild(el)

  const laneHeight = laneEl.clientHeight
  const startTime = performance.now()
  const duration = 2000

  function move(now) {
    const progress = (now - startTime) / duration
    if (progress >= 1) {
      el.remove()
      return
    }
    el.style.top = `${progress * (laneHeight + 40) - 10}px`
    requestAnimationFrame(move)
  }

  requestAnimationFrame(move)
}