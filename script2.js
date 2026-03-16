// =========================
// CHART.JS GLOBAL DEFAULTS (menu theme)
// =========================

document.addEventListener("DOMContentLoaded", () => {
    if (typeof Chart !== "undefined") {
      Chart.defaults.color = "#8a6048";
      Chart.defaults.borderColor = "rgba(43,26,14,0.08)";
      Chart.defaults.font.family = "'Cormorant Garamond', Georgia, serif";
      Chart.defaults.font.size = 12;
      Chart.defaults.plugins.tooltip.backgroundColor = "rgba(43,26,14,0.93)";
      Chart.defaults.plugins.tooltip.titleColor = "#f2ece0";
      Chart.defaults.plugins.tooltip.bodyColor = "#b0a090";
      Chart.defaults.plugins.tooltip.borderColor = "rgba(192,82,43,0.4)";
      Chart.defaults.plugins.tooltip.borderWidth = 1;
    }
  });
  
  // =========================
  // GLOBALS
  // =========================
  
  let rawData = [];
  
  let boroughCuisineChart = null;
  let priceHistogramChart = null;
  let cuisinePriceChart = null;
  let wordFrequencyChart = null;
  let expensiveRestaurantsChart = null;
  let expensiveDishesChart = null;
  let luxuryWordsChart = null;
  
  // East Village ZIPs only
  const EAST_VILLAGE_ZIPS = [10003, 10009];
  
  // =========================
  // BASIC HELPERS
  // =========================
  
  function safeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  
  function mean(arr) {
    if (!arr.length) return null;
    let total = 0;
    for (let i = 0; i < arr.length; i++) total += arr[i];
    return total / arr.length;
  }
  
  function median(arr) {
    if (!arr.length) return null;
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
  
  function formatMoney(value) {
    if (value == null || isNaN(value)) return "–";
    return Number(value).toFixed(2);
  }
  
  function normalizeText(s) {
    return (s || "")
      .toString()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }
  
  function avg(arr) {
    if (!arr.length) return null;
    let sum = 0;
    for (const x of arr) sum += x;
    return sum / arr.length;
  }
  
  // =========================
  // LOAD CSV DATA
  // =========================
  
  function loadData() {
    return fetch("finalupdated.csv")
      .then((resp) => {
        if (!resp.ok) throw new Error("Failed to load CSV. Check file name & path.");
        return resp.text();
      })
      .then((text) => {
        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        return parsed.data;
      });
  }
  
  // =========================
  // EAST VILLAGE FILTER
  // =========================
  
  function filterEastVillage(data) {
    return data.filter((row) => {
      const zip = safeNumber(row.zip_code);
      return zip && EAST_VILLAGE_ZIPS.includes(zip);
    });
  }
  
  // =========================
  // VIZ 2 – NEIGHBORHOOD PRICING
  // =========================
  
  function preparePriceHistogram(data) {
    let prices = [];
  
    data.forEach((row) => {
      const p = safeNumber(row.item_price_clean);
      if (p && p > 0) prices.push(p);
    });
  
    if (!prices.length) return null;
  
    // Cap all prices at max $150 for display stability
    prices = prices.map((p) => Math.min(p, 150));
  
    const maxPrice = 150;
    const binSize = 10;
    const binCount = Math.ceil(maxPrice / binSize);
    const bins = new Array(binCount).fill(0);
  
    prices.forEach((p) => {
      let idx = Math.floor(p / binSize);
      if (idx >= binCount) idx = binCount - 1;
      bins[idx]++;
    });
  
    const labels = bins.map((_, i) => {
      const start = i * binSize;
      const end = start + binSize;
      return i === binCount - 1 ? `$${start}+` : `$${start}–${end}`;
    });
  
    return { labels, bins, prices };
  }
  
  function prepareCuisinePriceStats(data) {
    const byCuisine = {};
  
    data.forEach((row) => {
      const cuisine = row["CUISINE DESCRIPTION"];
      const price = safeNumber(row.item_price_clean);
      if (!cuisine || !price || price <= 0) return;
      if (!byCuisine[cuisine]) byCuisine[cuisine] = [];
      byCuisine[cuisine].push(price);
    });
  
    const list = [];
    for (const cuisine in byCuisine) {
      const prices = byCuisine[cuisine];
      list.push({
        cuisine,
        median: median(prices),
        count: prices.length
      });
    }
  
    list.sort((a, b) => b.median - a.median);
    return list.slice(0, 8);
  }
  
  function updatePricingCharts(neighborhoodData, neighborhoodName) {
    const pricingStatus = document.getElementById("pricingStatus");
    const histPrepared = preparePriceHistogram(neighborhoodData);
  
    if (!histPrepared) {
      if (pricingStatus) {
        pricingStatus.innerHTML =
          "No valid price data for <strong>" + neighborhoodName + "</strong>.";
      }
      if (priceHistogramChart) priceHistogramChart.destroy();
      if (cuisinePriceChart) cuisinePriceChart.destroy();
      return;
    }
  
    const { labels, bins, prices } = histPrepared;
  
    // Histogram
    const histCanvas = document.getElementById("priceHistogramChart");
    if (histCanvas) {
      const histCtx = histCanvas.getContext("2d");
      if (priceHistogramChart) priceHistogramChart.destroy();
  
      priceHistogramChart = new Chart(histCtx, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Menu items",
            data: bins,
            backgroundColor: "rgba(192, 82, 43, 0.45)",
            borderColor: "rgba(192, 82, 43, 0.75)",
            borderWidth: 1,
            borderRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "Price distribution of menu items in " + neighborhoodName,
              color: "#5c3520",
              font: { family: "'Jost', sans-serif", size: 11, weight: "500" }
            }
          },
          scales: {
            x: {
              title: { display: true, text: "Item price", color: "#8a6048" },
              ticks: { color: "#8a6048" },
              grid: { color: "rgba(43,26,14,0.07)" }
            },
            y: {
              beginAtZero: true,
              title: { display: true, text: "Number of items", color: "#8a6048" },
              ticks: { color: "#8a6048" },
              grid: { color: "rgba(43,26,14,0.07)" }
            }
          }
        }
      });
    }
  
    // Cuisine median price chart
    const cuisineStats = prepareCuisinePriceStats(neighborhoodData);
    const cuisineCanvas = document.getElementById("cuisinePriceChart");
    if (cuisineCanvas) {
      const cuisineCtx = cuisineCanvas.getContext("2d");
      if (cuisinePriceChart) cuisinePriceChart.destroy();
  
      cuisinePriceChart = new Chart(cuisineCtx, {
        type: "bar",
        data: {
          labels: cuisineStats.map((d) => d.cuisine),
          datasets: [{
            label: "Median item price ($)",
            data: cuisineStats.map((d) => d.median),
            backgroundColor: "rgba(139, 26, 26, 0.6)",
            borderColor: "rgba(180, 50, 50, 0.9)",
            borderWidth: 1,
            borderRadius: 3
          }]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "Top cuisines by median price in " + neighborhoodName,
              color: "#5c3520",
              font: { family: "'Jost', sans-serif", size: 11, weight: "500" }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              title: { display: true, text: "Median item price (USD)", color: "#8a6048" },
              ticks: { color: "#8a6048" },
              grid: { color: "rgba(43,26,14,0.07)" }
            },
            y: {
              ticks: { color: "#8a6048", font: { size: 11 } },
              grid: { color: "rgba(43,26,14,0.06)" }
            }
          }
        }
      });
    }
  
    if (pricingStatus) {
      pricingStatus.innerHTML =
        "Pricing view for <strong>" + neighborhoodName +
        "</strong> based on <strong>" + prices.length +
        "</strong> priced menu items.";
    }
  }
  
  // =========================
  // VIZ 3 – MICRO LEVEL VIEW
  // =========================
  
  function prepareWordFrequency(neighborhoodData) {
    const stopwords = [
      "the", "and", "with", "of", "a", "an", "to", "or", "on", "in",
      "for", "your", "our", "served", "style", "by", "from", "at",
      "as", "over", "up", "be", "is", "de", "l", "oz"
    ];
    const stopSet = new Set(stopwords);
    const counts = {};
  
    neighborhoodData.forEach((row) => {
      const name = row.item_name_clean || row.item_name || "";
      if (!name) return;
  
      const words = name
        .toString()
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
  
      words.forEach((w) => {
        if (stopSet.has(w)) return;
        counts[w] = (counts[w] || 0) + 1;
      });
    });
  
    const entries = Object.keys(counts).map((word) => ({
      word,
      count: counts[word]
    }));
  
    entries.sort((a, b) => b.count - a.count);
    return entries.slice(0, 10);
  }
  
  function prepareExpensiveRestaurants(neighborhoodData) {
    const map = {};
  
    neighborhoodData.forEach((row) => {
      const name = row.restaurant_name;
      const price = safeNumber(row.item_price_clean);
      const dishName = row.item_name_clean || row.item_name;
  
      if (!name || !price || price <= 0) return;
  
      if (!map[name] || price > map[name].maxPrice) {
        map[name] = {
          name: name,
          maxPrice: price,
          dishName: dishName
        };
      }
    });
  
    const list = Object.values(map);
    list.sort((a, b) => b.maxPrice - a.maxPrice);
    return list.slice(0, 10);
  }
  
  function prepareExpensiveDishes(neighborhoodData) {
    const rowsWithPrice = neighborhoodData.filter((row) => {
      const price = safeNumber(row.item_price_clean);
      return price && price > 0;
    });
  
    rowsWithPrice.sort((a, b) => {
      return safeNumber(b.item_price_clean) - safeNumber(a.item_price_clean);
    });
  
    return rowsWithPrice.slice(0, 10);
  }
  
  // ---- NEW: Luxury words vs price ----
  function prepareLuxuryWordStats(neighborhoodData, words) {
    const results = [];
  
    for (const w of words) {
      const prices = [];
  
      for (const row of neighborhoodData) {
        const name = normalizeText(row.item_name_clean || row.item_name);
        const p = safeNumber(row.item_price_clean);
        if (!name || !Number.isFinite(p) || p <= 0) continue;
  
        const re = new RegExp(`\\b${w}\\b`, "i"); // "house" won't match "warehouse"
        if (re.test(name)) prices.push(p);
      }
  
      results.push({
        word: w,
        meanPrice: avg(prices),
        count: prices.length
      });
    }
  
    // highest avg first; nulls last
    results.sort((a, b) => {
      if (a.meanPrice == null && b.meanPrice == null) return 0;
      if (a.meanPrice == null) return 1;
      if (b.meanPrice == null) return -1;
      return b.meanPrice - a.meanPrice;
    });
  
    return results;
  }
  
  function updateLuxuryWordsChart(neighborhoodData, neighborhoodName) {
    const canvas = document.getElementById("luxuryWordsChart");
    if (!canvas) return;
  
    const WORDS = ["truffle", "wagyu", "caviar", "tasting", "signature", "handmade", "house"];
  
    const stats = prepareLuxuryWordStats(neighborhoodData, WORDS);
  
    // Filter out words with no matches so the doughnut isn't padded with zeros
    const filtered = stats.filter(d => d.meanPrice != null && d.count > 0);
    const labels  = filtered.map(d => d.word);
    const values  = filtered.map(d => Number(d.meanPrice.toFixed(2)));
    const counts  = filtered.map(d => d.count);
  
    // Sketch palette: ink, red, blue, amber, and softer tints
    const COLORS = [
      "rgba(192,82,43,0.80)",
      "rgba(107,143,106,0.80)",
      "rgba(201,138,42,0.80)",
      "rgba(43,26,14,0.75)",
      "rgba(192,82,43,0.50)",
      "rgba(107,143,106,0.50)",
      "rgba(201,138,42,0.50)"
    ];
  
    const ctx = canvas.getContext("2d");
    if (luxuryWordsChart) luxuryWordsChart.destroy();
  
    luxuryWordsChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          label: "Avg price ($)",
          data: values,
          backgroundColor: COLORS.slice(0, labels.length),
          borderColor: "rgba(245,237,224,0.95)",
          borderWidth: 2,
          hoverOffset: 8,
          customCounts: counts
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "58%",
        plugins: {
          legend: {
            display: true,
            position: "right",
            labels: {
              color: "#8a6048",
              font: { family: "'Jost', sans-serif", size: 11 },
              boxWidth: 10,
              padding: 10,
              generateLabels: function(chart) {
                const data = chart.data;
                return data.labels.map((label, i) => ({
                  text: `${label}  $${data.datasets[0].data[i]}`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: "rgba(242,236,224,0.9)",
                  lineWidth: 1,
                  index: i
                }));
              }
            }
          },
          title: {
            display: true,
            text: "Luxury words vs avg price — " + neighborhoodName,
            color: "#5c3520",
            font: { family: "'Jost', sans-serif", size: 11, weight: "500" },
            padding: { bottom: 8 }
          },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                const n = ctx.dataset.customCounts?.[ctx.dataIndex] ?? 0;
                return [
                  `Avg price: $${Number(ctx.raw).toFixed(2)}`,
                  `Menu appearances: ${n}`
                ];
              }
            }
          }
        }
      }
    });
  }
  
  function updateMicroLevelCharts(neighborhoodData, neighborhoodName) {
    const microStatus = document.getElementById("microStatus");
  
    if (!neighborhoodData.length) {
      if (microStatus) {
        microStatus.innerHTML = "No data available for <strong>" + neighborhoodName + "</strong>.";
      }
      if (wordFrequencyChart) wordFrequencyChart.destroy();
      if (expensiveRestaurantsChart) expensiveRestaurantsChart.destroy();
      if (expensiveDishesChart) expensiveDishesChart.destroy();
      if (luxuryWordsChart) luxuryWordsChart.destroy();
      return;
    }
  
    // A. Flavour words – Polar Area
    const wordCanvas = document.getElementById("wordFrequencyChart");
    if (wordCanvas) {
      const wordEntries = prepareWordFrequency(neighborhoodData);
      const wordLabels = wordEntries.map((d) => d.word);
      const wordCounts = wordEntries.map((d) => d.count);
  
      const wordCtx = wordCanvas.getContext("2d");
      if (wordFrequencyChart) wordFrequencyChart.destroy();
  
      wordFrequencyChart = new Chart(wordCtx, {
        type: "polarArea",
        data: {
          labels: wordLabels,
          datasets: [{
            label: "Word frequency",
            data: wordCounts,
            borderWidth: 1,
            hoverBorderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
            title: {
              display: true,
              text: "Top flavour words in " + neighborhoodName + " menus"
            }
          }
        }
      });
    }
  
    // B. Highest-priced dish per restaurant – Bar chart (x-axis = dish name)
    const restCanvas = document.getElementById("expensiveRestaurantsChart");
    if (restCanvas) {
      const restEntries = prepareExpensiveRestaurants(neighborhoodData);
      const restCtx = restCanvas.getContext("2d");
  
      if (expensiveRestaurantsChart) expensiveRestaurantsChart.destroy();
  
      expensiveRestaurantsChart = new Chart(restCtx, {
        type: "bar",
        data: {
          labels: restEntries.map(d => d.dishName || "Dish name unavailable"),
          datasets: [{
            label: "Highest dish price ($)",
            data: restEntries.map(d => d.maxPrice),
            backgroundColor: "rgba(201,138,42,0.50)",
            borderColor: "rgba(201,138,42,0.85)",
            borderWidth: 1,
            borderRadius: 4,
  
            // ✅ tooltip needs restaurant + price
            customData: restEntries.map(d => ({
              restaurant: d.name,
              dish: d.dishName,
              price: d.maxPrice
            }))
          }]
        },
        options: {
          indexAxis: "x",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "Highest-priced dishes in " + neighborhoodName
            },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  const info = ctx.dataset.customData?.[ctx.dataIndex] || {};
                  const restaurant = info.restaurant || "Restaurant unavailable";
                  const price =
                    info.price != null && Number.isFinite(info.price)
                      ? Number(info.price).toFixed(2)
                      : "–";
                  return [
                    "Restaurant: " + restaurant,
                    "Price: $" + price
                  ];
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Price (USD)" }
            },
            x: {
              title: { display: true, text: "Dish" },
              ticks: {
                autoSkip: false,
                maxRotation: 45,
                minRotation: 45,
                font: { size: 10 }
              }
            }
          }
        }
      });
    }
  
    // C. Top 10 most expensive restaurants
  const canvas = document.getElementById("expensiveDishesChart");
  if (canvas) {
    const rows = prepareExpensiveRestaurants(neighborhoodData);
    const ctx = canvas.getContext("2d");
  
    if (expensiveDishesChart) expensiveDishesChart.destroy();
  
    expensiveDishesChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: rows.map(r => r.name),   // ✅ FIXED
        datasets: [{
          label: "Highest dish price ($)",
          data: rows.map(r => r.maxPrice),
          backgroundColor: "rgba(43,26,14,0.55)",
          borderColor: "rgba(43,26,14,0.75)",
          borderWidth: 1,
          customData: rows
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "Top 10 most expensive restaurants in " + neighborhoodName
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const r = ctx.dataset.customData[ctx.dataIndex];
                return [
                  `Restaurant: ${r.name}`,       // ✅ FIXED
                  `Highest dish: ${r.dishName}`, // ✅ FIXED
                  `Price: $${Number(r.maxPrice).toFixed(2)}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: { display: true, text: "Highest dish price (USD)" }
          }
        }
      }
    });
  }
  
  
  
    // D. Luxury words vs price (optional canvas)
    updateLuxuryWordsChart(neighborhoodData, neighborhoodName);
  
    if (microStatus) {
      microStatus.innerHTML =
        "Micro-level view for <strong>" + neighborhoodName +
        "</strong> based on <strong>" + neighborhoodData.length + "</strong> menu rows.";
    }
  }
  
  // =========================
  // UPDATE – EAST VILLAGE ONLY
  // =========================
  
  function updateEastVillageViews() {
    const neighborhoodName = "East Village";
    const neighborhoodData = filterEastVillage(rawData);
  
    updatePricingCharts(neighborhoodData, neighborhoodName);
    updateMicroLevelCharts(neighborhoodData, neighborhoodName);
  }
  
  // =========================
  // INITIALIZE
  // =========================
  
  loadData()
    .then((data) => {
      rawData = data;
      updateEastVillageViews();
    })
    .catch((err) => {
      console.error(err);
      const boroughStatus = document.getElementById("boroughStatus");
      const pricingStatus = document.getElementById("pricingStatus");
      const microStatus = document.getElementById("microStatus");
  
      if (boroughStatus) boroughStatus.innerHTML = "Error loading data: " + err.message;
      if (pricingStatus) pricingStatus.innerHTML = "Error loading data.";
      if (microStatus) microStatus.innerHTML = "Error loading data.";
    });