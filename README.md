# Divine Insight

**Divine Insight** is a specialized market analysis tool for *Path of Exile*, designed to help players make informed investment decisions by visualizing price trends and predicting future returns.

## Features

- **Multi-League Analysis**: Compare price trends across past leagues (Mercenaries, Settlers, Necropolis) to identify average patterns.
- **Live Data Integration**: Fetch real-time market data from [poe.ninja](https://poe.ninja) (Keepers League) to compare current trends against historical averages.
- **ROI Prediction**: Calculate predicted Return on Investment (ROI) based on customizable "Buy Day" and "Sell Day" windows.
- **Dual Currency Standard**: Toggle between **Chaos Orb** and **Divine Orb** valuation to analyze trends relative to the most stable high-value currency.
- **Interactive Visualization**: Explore price histories with interactive D3.js charts, highlighting your investment window.

## Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS + DaisyUI
- **Visualization**: D3.js
- **Data Source**: Historical CSV data & poe.ninja API

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/s5422053/theme2025-nengu.git
    cd theme2025-nengu
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to the URL provided (usually `http://localhost:5173`).

## Project Structure

- `src/components`: React components (Dashboard, Sidebar, Charts).
- `src/api`: API integration logic for poe.ninja.
- `src/data`: Processed historical league data (CSV/JSON).
- `netlify/functions`: Serverless functions for proxying API requests.

---
*Note: This tool is a fan-made project and is not affiliated with Grinding Gear Games.*