import { categoryColors } from "./colors"
import { WORLD_POPULATION_2050 } from "./constants"

export function initState(data_avg, preset) {
  return data_avg.map(d => ({
    category: d.category,
    ghg_per_kg:   d.ghg_per_kg,
    land_per_kg:  d.land_per_kg,
    water_per_kg: d.water_per_kg,
    grams_per_day: preset.categories[d.category] ?? 0
  }))
}

export function computeTotals(state) {
  return state.map(d => ({
    category: d.category,
    ghg:  (d.ghg_per_kg  * (d.grams_per_day / 1000)) * 10, // converte a tonnellata per giorno, scalata su tutta la popolazione mondiale
    land: d.land_per_kg * (d.grams_per_day / 1000),
    water: d.water_per_kg * (d.grams_per_day / 1000) * WORLD_POPULATION_2050 / 1000,
    grams_per_day: d.grams_per_day
  }))
}

export function renderTopBar(state, onStateChange) {
  const header = document.getElementById('top-bar')
  
  // Remove existing cards
  header.querySelectorAll('.food-card').forEach(el => el.remove())

  // One card per active category
  const totalGrams = state
    .filter(d => d.grams_per_day > 0)
    .reduce((sum, d) => sum + d.grams_per_day, 0)

  state
    .filter(d => d.grams_per_day > 0)
    .forEach(d => {
      const card = document.createElement('div')

        const proportion = d.grams_per_day / totalGrams
        const labelVisible = proportion >= 0.1 // show label only if element is big enough, avoids cluttering

        const widthPercent = Math.max(proportion * 100, 1)
        card.style.width = `${widthPercent}%`

      card.className = 'food-card flex flex-col px-4 py-2 border border-gray-600 rounded-lg h-16 justify-center cursor-pointer overflow-hidden hover:border-white transition'
      card.innerHTML = labelVisible ? `
        <span class="text-sm font-medium">${d.category}</span>
        <span class="text-xs text-gray-400">${d.grams_per_day}g / day</span>
      ` : ''

      if (!labelVisible) {
        const tooltip = document.getElementById('tooltip-ghg')
        card.addEventListener('mouseover', (event) => {
          tooltip.innerHTML = `<strong>${d.category}</strong><br>${d.grams_per_day}g / day`
          tooltip.classList.remove('hidden')
        })
        card.addEventListener('mousemove', (event) => {
          tooltip.style.left = (event.pageX + 12) + 'px'
          tooltip.style.top = (event.pageY - 26) + 'px'
        })
        card.addEventListener('mouseout', () => {
          tooltip.classList.add('hidden')
        })
      }

      card.style.backgroundColor = categoryColors[d.category] + '77'
      card.style.borderColor = categoryColors[d.category]
      card.addEventListener('click', () => openEditModal(d, state, onStateChange))
      header.insertBefore(card, document.getElementById('add-food-btn'))
    })
    document.getElementById('add-food-btn').onclick = () => openAddModal(state, onStateChange)
}

function openEditModal(item, state, onStateChange) {
  // Create overlay
  const overlay = document.createElement('div')
  overlay.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50'

  // Create modal box
  overlay.innerHTML = `
    <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col gap-4 w-72" id="modal-box">
      <h2 class="text-lg font-semibold">${item.category}</h2>
      <div class="flex flex-col gap-1">
        <label class="text-sm text-gray-400">Grams per day</label>
        <input 
          id="modal-input"
          type="number" 
          min="0"
          value="${item.grams_per_day}"
          class="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
        />
      </div>
      <div class="flex gap-2">
        <button id="modal-save" class="flex-1 bg-white text-gray-950 rounded-lg py-2 font-medium hover:bg-gray-200 transition">Save</button>
        <button id="modal-remove" class="flex-1 border border-gray-600 text-gray-400 rounded-lg py-2 hover:border-red-500 hover:text-red-500 transition">Remove</button>
      </div>
    </div>
  `

  // Close on overlay click (but not modal box click)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) document.body.removeChild(overlay)
  })

  // Save button
  overlay.querySelector('#modal-save').addEventListener('click', () => {
    const newGrams = parseInt(overlay.querySelector('#modal-input').value)
    item.grams_per_day = isNaN(newGrams) ? 0 : newGrams
    document.body.removeChild(overlay)
    onStateChange()
  })

  // Remove button
  overlay.querySelector('#modal-remove').addEventListener('click', () => {
    item.grams_per_day = 0
    document.body.removeChild(overlay)
    onStateChange()
  })

  document.body.appendChild(overlay)
}

function openAddModal(state, onStateChange) {
  const inactive = state.filter(d => d.grams_per_day === 0)

  const overlay = document.createElement('div')
  overlay.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50'

  overlay.innerHTML = `
    <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col gap-4 w-72" id="modal-box">
      <h2 class="text-lg font-semibold">Add Food</h2>
      <div class="flex flex-col gap-2 max-h-64 overflow-y-auto">
        ${inactive.map(d => `
          <button 
            class="add-category-btn text-left px-3 py-2 rounded-lg border border-gray-700 hover:border-white hover:text-white text-gray-400 transition"
            data-category="${d.category}"
          >${d.category}</button>
        `).join('')}
      </div>
    </div>
  `

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) document.body.removeChild(overlay)
  })

  overlay.querySelectorAll('.add-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = state.find(d => d.category === btn.dataset.category)
      document.body.removeChild(overlay)
      openEditModal(item, state, onStateChange)
    })
  })

  document.body.appendChild(overlay)
}

export function renderPresetSelector(presets, state, onStateChange) {
  const selector = document.getElementById('preset-selector')
  
  // Populate options
  selector.innerHTML = presets.map(p => 
    `<option value="${p.id}">${p.label}</option>`
  ).join('')

  // On change, update state grams from the selected preset
  selector.addEventListener('change', () => {
    const selected = presets.find(p => p.id === selector.value)
    state.forEach(d => {
      d.grams_per_day = selected.categories[d.category] ?? 0
    })
    onStateChange()
  })
}