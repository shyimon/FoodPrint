export function initState(data_avg, preset) {
  return data_avg.map(d => ({
    category: d.category,
    ghg_per_kg:   d.ghg_per_kg,
    land_per_kg:  d.land_per_kg,
    water_per_kg: d.water_per_kg,
    grams_per_week: preset.categories[d.category] ?? 0
  }))
}

export function computeTotals(state) {
  return state.map(d => ({
    category: d.category,
    ghg:  d.ghg_per_kg  * (d.grams_per_week / 1000),
    land: d.land_per_kg * (d.grams_per_week / 1000),
    water: d.water_per_kg * (d.grams_per_week / 1000),
    grams_per_week: d.grams_per_week
  }))
}