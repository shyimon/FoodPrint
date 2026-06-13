import * as d3 from 'd3'
import { ANIMAL_DEATHS_PER_KG, WORLD_POPULATION_2050, SECONDS_PER_WEEK } from '../constants.js'

const EMOJIS_PER_ROW = 20
const ROW_HEIGHT = 32

const laneState = {}
let animationRunning = false
let lastTime = performance.now()

const LANES = [
  { id: 'cow',     emoji: '🐮', label: 'Cow deaths' },
  { id: 'pig',     emoji: '🐷', label: 'Pig deaths' },
  { id: 'chicken', emoji: '🐔', label: 'Chicken deaths' },
]

// Compute deaths per second for each lane from current state
export function computeDeathRates(totals) {
  const red_meat    = totals.find(d => d.category === 'Red Meat')?.grams_per_week ?? 0
  const white_meat  = totals.find(d => d.category === 'White Meat')?.grams_per_week ?? 0
  const dairy_eggs  = totals.find(d => d.category === 'Dairy & Eggs')?.grams_per_week ?? 0

  return {
    cow:     (ANIMAL_DEATHS_PER_KG.beef     * red_meat   / 1000 * WORLD_POPULATION_2050) / SECONDS_PER_WEEK,
    pig:     (ANIMAL_DEATHS_PER_KG.pork     * white_meat / 1000 * WORLD_POPULATION_2050) / SECONDS_PER_WEEK,
    chicken: ((ANIMAL_DEATHS_PER_KG.chicken * white_meat / 1000) + (ANIMAL_DEATHS_PER_KG.eggs_dairy * dairy_eggs / 1000)) * WORLD_POPULATION_2050 / SECONDS_PER_WEEK,
  }
}