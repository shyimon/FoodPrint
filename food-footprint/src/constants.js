export const WORLD_POPULATION_2050 = 10000000000
export const SECONDS_PER_DAY = 24 * 3600

// goals stabiliti dalla commissioe eat-lancet per la sostenibilità
// vengono usati per disegnare linee di demarcazione nella gui
export const EAT_LANCET_GHG_GOAL = 13698630.1369863 / 1000000 // espresso in milioni di tonnellate per giorno
export const EAT_LANCET_LAND_GOAL = 48000000 // km2
export const EAT_LANCET_WATER_GOAL = 2000000000000000 / 365 / 1000 // espresso in tonnellate cubiche per giorno sulla popolazione mondiale

export const ANIMAL_DEATHS_PER_KG = {
  beef:       0.0029913,
  pork:       0.4189047,
  chicken:    0.6646975,
  eggs_dairy: 0.0817,   // media fra uova e latticini
  fish:       33.0123007
}