import pandas as pd 
import json

land = pd.read_csv("food-footprint/data/raw/land_kg.csv")
water = pd.read_csv("food-footprint/data/raw/water_kg.csv")
ghg = pd.read_csv("food-footprint/data/raw/co2_kg.csv")

df = land[["Entity", "land_per_kg"]] \
    .merge(water[["Entity", "water_per_kg"]], on="Entity", how="outer") \
    .merge(ghg[["Entity", "ghg_per_kg"]], on="Entity", how="outer")

categories = {
    "Beef & Lamb": ["Beef (beef herd)", "Beef (dairy herd)", "Lamb & Mutton"],
    "Pork": ["Pig Meat"],
    "Poultry": ["Poultry Meat"],
    "Eggs": ["Eggs"],
    "Dairy": ["Milk", "Cheese"],
    "Fish & Seafood": ["Fish (farmed)", "Prawns (farmed)"],
    "Vegetables": ["Brassicas", "Tomatoes", "Onions & Leeks"],
    "Fruits": ["Apples", "Bananas", "Berries & Grapes", "Citrus Fruit"],
    "Legumes": ["Peas", "Other Pulses", "Tofu"],
    "Nuts": ["Nuts", "Groundnuts"],
    "Whole Grains": ["Barley", "Rice", "Wheat & Rye", "Oatmeal", "Maize"],
    "Starchy Vegetables": ["Potatoes", "Root Vegetables"],
}

results = []
for category, entities in categories.items():
    subset = df[df["Entity"].isin(entities)]
    
    results.append({
        "category": category,
        "land_per_kg":  round(subset["land_per_kg"].mean(), 2),
        "water_per_kg": round(subset["water_per_kg"].mean(), 2),
        "ghg_per_kg":   round(subset["ghg_per_kg"].mean(), 2),
        "grams_per_day": 0
    })

with open("food-footprint/public/categories_avg.json", "w+") as f:
    json.dump(results, f, indent=2)

# worst for each categ
results = []
for category, entities in categories.items():
    subset = df[df["Entity"].isin(entities)]

    results.append({
        "category": category,
        "land_per_kg": round(subset.loc[subset["land_per_kg"].idxmax()]["land_per_kg"], 2),
        "water_per_kg": round(subset.loc[subset["water_per_kg"].idxmax()]["water_per_kg"], 2),
        "ghg_per_kg": round(subset.loc[subset["ghg_per_kg"].idxmax()]["ghg_per_kg"], 2),
        "grams_per_day": 0
    })

with open("food-footprint/public/categories_worst.json", "w+") as f:
    json.dump(results, f, indent=2)