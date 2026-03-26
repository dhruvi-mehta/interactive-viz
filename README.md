# NYC Menu Pricing Dashboard
### East Village Case Study

---

## Project Overview

This project analyses restaurant menu pricing in New York City, with a focused case study on the East Village (ZIP codes 10003 and 10009). The dashboard moves through three scales of analysis: a city-level spatial overview, neighbourhood-level pricing patterns, and micro-level menu characteristics.

The goal is to explore how cuisine type, menu language, and geographic location interact with pricing in one of New York City's most restaurant-dense neighbourhoods.

---

## Live Dashboard

The dashboard is deployed via GitHub Pages. You can view it here:
[https://dhruvi-mehta.github.io/interactive-viz/](https://dhruvi-mehta.github.io/interactive-viz/)

---

## Dataset

The analysis uses a combined dataset built from two sources:

| Source | Description |
|---|---|
| NYC Restaurant Inspection Dataset (NYC Open Data) | Restaurant-level attributes including name, address, ZIP code, and cuisine type |
| NYC Restaurant Menu Dataset (Kaggle) | Individual menu items and pricing |

The merged dataset includes restaurant name, address, ZIP code, cuisine description, individual menu items, cleaned prices, and geographic coordinates. Menu items are stored at the row level, enabling analysis at both the dish and restaurant scale.

**File:** `finalupdated.csv`

---

## Visualisations

### 1. City-Level Context (Manhattan)
An Observable map visualising the spatial distribution of restaurants across Manhattan. This establishes geographic context before narrowing the analysis to the East Village.

### 2. Neighbourhood Pricing (East Village)
- A price histogram showing the distribution of menu item prices across the neighbourhood
- Median price by cuisine, highlighting pricing differences across cuisine types within the same area

Prices are capped at $150 for visual clarity. Medians are used throughout to reduce the influence of extreme outliers.

### 3. Micro-Level Menu Analysis
- Top flavour words extracted from menu item names
- Highest-priced dish per restaurant, to compare pricing ceilings across venues
- Luxury words vs. price, examining whether menu language correlates with higher prices

---

## Key Findings

- Most East Village menu items fall within a relatively narrow price range
- Cuisine type strongly influences median pricing, even within the same neighbourhood
- Restaurants vary significantly in their maximum menu prices
- Luxury-associated menu language often, but not always, aligns with higher-priced dishes

---

## Tools and Technologies

| Purpose | Tool |
|---|---|
| Data processing and analysis | JavaScript |
| Charts and visualisations | Chart.js |
| City-level map | Observable |
| Layout and styling | HTML, CSS |

All analysis and rendering are performed on the client side, with no backend required.

---


## How to Run Locally

No installation or build step is required. All processing happens client-side.

1. Clone the repository:
```bash
git clone https://github.com/dhruvi-mehta/interactive-viz.git
cd interactive-viz
```

2. Open `index.html` in your browser directly, or use a local server for best results:
```bash
npx serve .
```

---

## Data Sources

NYC OpenData. (2023). *DOHMH New York City Restaurant Inspection Results.* https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j

Kaggle. (2023). *NYC Restaurant Menus Dataset.* https://www.kaggle.com/

---

*Built with JavaScript, Chart.js, and Observable. Data from NYC Open Data and Kaggle.*
