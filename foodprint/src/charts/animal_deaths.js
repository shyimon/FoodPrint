import { ANIMAL_DEATHS_PER_KG, WORLD_POPULATION_2050, SECONDS_PER_DAY } from '../constants.js'

// proporzioni emoji = quante morti; dovrebbero essere uguali per rendere più chiara la visualizzazione
const proportions = {cow: 10, pig: 10, chicken: 10}

// quanti animali per riga
const rowSize = {cow: 1, pig: 5, chicken: 10}

const absolute_deaths = {cow: 0, pig: 0, chicken: 0}

const LANES = [
  { id: 'cow',     emoji: '🐮'.repeat(rowSize.cow), label: `1 icon = ${proportions.cow} dead Cows`,     proportion: proportions.cow, rowSize: rowSize.cow},   
  { id: 'pig',     emoji: '🐷'.repeat(rowSize.pig), label: `1 icon = ${proportions.pig} dead Pigs`,     proportion: proportions.pig, rowSize: rowSize.pig },  
  { id: 'chicken', emoji: '🐔'.repeat(rowSize.chicken), label: `1 icon = ${proportions.chicken} dead Chickens`, proportion: proportions.chicken, rowSize: rowSize.chicken },  
]

export function resetAnimalDeaths() {
  absolute_deaths.cow = 0
  absolute_deaths.pig = 0
  absolute_deaths.chicken = 0
  LANES.forEach(lane => {
    const el = document.getElementById('counter-' + lane.id)
    if (el) el.textContent = '0'
  })
}

export function computeDeathRates(totals) { // scalato per la popolazione mondiale, in tempo reale
  const beef_lamb  = totals.find(d => d.category === 'Beef & Lamb')?.grams_per_day ?? 0
  const pork       = totals.find(d => d.category === 'Pork')?.grams_per_day ?? 0
  const poultry    = totals.find(d => d.category === 'Poultry')?.grams_per_day ?? 0
  const eggs       = totals.find(d => d.category === 'Eggs')?.grams_per_day ?? 0
  const dairy      = totals.find(d => d.category === 'Dairy')?.grams_per_day ?? 0

  const cowDeaths      = ((ANIMAL_DEATHS_PER_KG.beef    * beef_lamb / 1000) +
                          (ANIMAL_DEATHS_PER_KG.dairy * dairy / 1000) * WORLD_POPULATION_2050) / SECONDS_PER_DAY
  const pigDeaths      = (ANIMAL_DEATHS_PER_KG.pork    * pork      / 1000 * WORLD_POPULATION_2050) / SECONDS_PER_DAY
  const chickenDeaths  = (
    (ANIMAL_DEATHS_PER_KG.chicken    * poultry / 1000) +
    (ANIMAL_DEATHS_PER_KG.eggs * eggs    / 1000)
  ) * WORLD_POPULATION_2050 / SECONDS_PER_DAY

  return { cow: cowDeaths / rowSize.cow, pig: pigDeaths / rowSize.pig, chicken: chickenDeaths / rowSize.chicken }
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
        <div class="flex flex-col items-center py-2 z-10 shrink-0">
          <span class="text-xs text-gray-400">1 icon = ${lane.proportion} dead ${lane.id}s</span>
        </div>
        <div class="lane-icons relative flex-1 w-full" id="lane-${lane.id}"></div>
        <div class="flex flex-col items-center py-2 shrink-0">
          <span id="counter-${lane.id}" class="text-white font-mono text-sm">0</span>
          <span class="text-xs text-gray-400">deaths</span>
        </div>
      `
      container.querySelector('.animal-lanes').appendChild(col)
    })
  }

  // Update lane rates
  LANES.forEach(lane => {
    laneStates[lane.id] = {
      rate:        rates[lane.id] / lane.proportion, // emoji per secondo
      realRate:    rates[lane.id],                   // animali per secondo
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
      ls.accumulator += ls.rate * elapsed

      const laneEl = document.getElementById(`lane-${lane.id}`)
      if (!laneEl) return

      while (ls.accumulator >= 1) {
        ls.accumulator -= 1
        spawnEmoji(laneEl, lane.emoji, lane.id, lane.proportion, lane.rowSize)
      }
    })

    animationId = requestAnimationFrame(tick)
  }

  animationId = requestAnimationFrame(tick)
}

function spawnEmoji(laneEl, emoji, laneId, proportion, rowSize) {
  absolute_deaths[laneId] += proportion * rowSize
  updateCounter(laneId)

  const el = document.createElement('div')
  el.className = 'animal-icon absolute'
  if(emoji == "🐔".repeat(rowSize)) { // dimensione emoji dipende da quante emoji ci sono per riga
    el.style.fontSize = '8px'
  } else if (emoji == '🐮'.repeat(rowSize)) {  
    el.style.fontSize = '60px'
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
  const duration = 1750 // vaelocità scorrimento emoji

  function move(now) {
    const progress = (now - startTime) / duration
    if (progress >= 1) {
      el.remove()
      return
    }
    el.style.top = `${progress * (laneHeight -50) - 10}px`
    requestAnimationFrame(move)
  }

  requestAnimationFrame(move)
}

function updateCounter(laneId) {
  const el = document.getElementById('counter-' + laneId)
  if (el) el.textContent = absolute_deaths[laneId].toLocaleString()
}