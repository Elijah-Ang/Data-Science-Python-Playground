# Data Science Python Playground

A browser-only Python playground for inspecting, wrangling, visualising, and analysing complete real-world datasets.

## Run locally

Serve the project from its root so the browser can read the CSV files:

```bash
python3 -m http.server 8000
```

Then open <http://127.0.0.1:8000/>.

The Python runtime runs in a Web Worker through Pyodide. The first load needs internet access to fetch Pyodide, pandas, matplotlib, SciPy, and seaborn from their public package sources.

## Deployment

The `main` branch deploys automatically to GitHub Pages through [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

Live site: <https://elijah-ang.github.io/Data-Science-Python-Playground/>

## Included data

- Seoul Bike Sharing Demand
- Candy Power Ranking
- Gapminder
- Wine Quality

All bundled CSV files remain local to the browser session. Uploaded CSVs are processed in the current tab and are not saved automatically.
