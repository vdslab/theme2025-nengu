// src/data/mockData.js
// This is a sample mock data structure.
// In a real application, this would be generated from the CSV data.

export const mockChartData = [
  {
    name: 'Divine Orb',
    values: [
      { day: 1, price: 180 },
      { day: 3, price: 200 },
      { day: 7, price: 220 },
      { day: 14, price: 250 },
      { day: 21, price: 240 },
      { day: 30, price: 230 },
    ],
  },
  {
    name: 'Exalted Orb',
    values: [
      { day: 1, price: 20 },
      { day: 3, price: 18 },
      { day: 7, price: 15 },
      { day: 14, price: 12 },
      { day: 21, price: 10 },
      { day: 30, price: 9 },
    ],
  },
  {
    name: 'Mirror of Kalandra',
    values: [
      { day: 1, price: 80000 },
      { day: 3, price: 85000 },
      { day: 7, price: 90000 },
      { day: 14, price: 100000 },
      { day: 21, price: 110000 },
      { day: 30, price: 120000 },
    ],
  },
];

export const mockTableData = [
    {
        name: "Divine Orb",
        buyPrice: 200,
        sellPrice: 250,
        roi: 25.0,
    },
    {
        name: "Exalted Orb",
        buyPrice: 18,
        sellPrice: 12,
        roi: -33.3,
    },
    {
        name: "Mirror of Kalandra",
        buyPrice: 85000,
        sellPrice: 100000,
        roi: 17.6,
    }
]
