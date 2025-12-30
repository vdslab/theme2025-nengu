import fs from 'fs';
import path from 'path';
import { dsvFormat } from 'd3-dsv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../src/data');
const outputFilePath = path.join(dataDir, 'processedData.js');
const rawDataFilePath = path.join(dataDir, 'rawData.json');

// Helper function to create a normalized key for matching
const normalizeName = (name) => {
    if (!name) return '';
    // Strip all non-alphanumeric characters and trailing 's' to create a robust key
    return name.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace(/s$/, '');
};

async function fetchIconsForType(league, type, iconMap) {
    let success = false;

    // 1. Try currencyoverview
    try {
        const url = `https://poe.ninja/api/data/currencyoverview?league=${league}&type=${type}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (response.ok) {
            const data = await response.json();
            let count = 0;
            
            // Check currencyDetails (common source for currency icons)
            if (data.currencyDetails) {
                data.currencyDetails.forEach(detail => {
                    if (detail.name && detail.icon) {
                        iconMap[normalizeName(detail.name)] = detail.icon;
                        count++;
                    }
                });
            }

            // Check lines (fallback or for some types)
            if (data.lines) {
                data.lines.forEach(item => {
                    const name = item.currencyTypeName || item.name;
                    if (name && item.icon) {
                        iconMap[normalizeName(name)] = item.icon;
                        count++;
                    }
                });
            }
            
            if (count > 0) {
                console.log(`Fetched icons for ${type} via currencyoverview (${count} items)`);
                success = true;
            }
        }
    } catch (error) {
        // console.error(`Error fetching currencyoverview for ${type}:`, error.message);
    }

    if (success) return;

    // 2. Try itemoverview (if currencyoverview didn't yield results or failed, or just to be sure)
    try {
        const url = `https://poe.ninja/api/data/itemoverview?league=${league}&type=${type}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (response.ok) {
            const data = await response.json();
            let count = 0;
            if (data.lines) {
                data.lines.forEach(item => {
                    const name = item.name || item.currencyTypeName;
                    if (name && item.icon) {
                        iconMap[normalizeName(name)] = item.icon;
                        count++;
                    }
                });
            }
             if (count > 0) {
                console.log(`Fetched icons for ${type} via itemoverview (${count} items)`);
            }
        }
    } catch (error) {
        console.error(`Error fetching icons for ${type}:`, error.message);
    }
}


async function main() {
    console.log('Fetching icon data from poe.ninja API...');
    const iconMap = {};
    const itemTypes = [
        'Currency', 'Fragment', 'Scarab', 'Fossil', 'Resonator', 'Essence', 'DivinationCard',
        'Prophecy', 'Oil', 'Incubator', 'UniqueWeapon', 'UniqueArmour', 'UniqueAccessory',
        'UniqueFlask', 'UniqueJewel', 'SkillGem', 'ClusterJewel', 'Map', 'BlightedMap', 'BlightRavagedMap',
        'Invitation', 'Memory', 'Beast', 'Artifact', 'DeliriumOrb', 'Vial'
    ];

    // Use Standard league for icons as they are generally stable
    for (const type of itemTypes) {
        await fetchIconsForType('Standard', type, iconMap);
    }
    
    console.log(`Successfully collected icons for ${Object.keys(iconMap).length} distinct items.`);

    // --- Start of manual mapping (keys are normalized) ---
    const manualIconMap = {
      [normalizeName('Gift to the Goddess')]: 'https://web.poecdn.com/image/Art/2DItems/Maps/LabyrinthHarvestInfused1.png',
      [normalizeName('Splinter of Chayula')]: 'https://web.poecdn.com/image/Art/2DItems/Currency/Breach/BreachShardChaos.png',
      [normalizeName('Splinter of Tul')]: 'https://web.poecdn.com/image/Art/2DItems/Currency/Breach/BreachShardCold.png',
      [normalizeName('Splinter of Xoph')]: 'https://web.poecdn.com/image/Art/2DItems/Currency/Breach/BreachShardFire.png',
      [normalizeName('Splinter of Uul-Netol')]: 'https://web.poecdn.com/image/Art/2DItems/Currency/Breach/BreachShardPhysical.png',
      [normalizeName('Splinter of Esh')]: 'https://web.poecdn.com/image/Art/2DItems/Currency/Breach/BreachShardLightning.png',
      [normalizeName('Blessing of Chayula')]: 'https://web.poecdn.com/image/Art/2DItems/Currency/Breach/BreachUpgradeChaos.png',
      [normalizeName('Blessing of Tul')]: 'https://web.poecdn.com/image/Art/2DItems/Currency/Breach/BreachUpgradeCold.png',
      [normalizeName('Blessing of Xoph')]: 'https://web.poecdn.com/image/Art/2DItems/Currency/Breach/BreachUpgradeFire.png',
      [normalizeName('Blessing of Uul-Netol')]: 'https://web.poecdn.com/image/Art/2DItems/Currency/Breach/BreachUpgradePhysical.png',
      [normalizeName('Blessing of Esh')]: 'https://web.poecdn.com/image/Art/2DItems/Currency/Breach/BreachUpgradeLightning.png',
      [normalizeName("Rogue's Marker")]: 'https://web.poecdn.com/image/Art/2DItems/Currency/Heist/HeistCoinCurrency.png',
      [normalizeName("Otherworldly Scouting Report")]: 'https://web.poecdn.com/image/Art/2DItems/Currency/ScoutingReport.png',
      [normalizeName("Delirious Scouting Report")]: 'https://web.poecdn.com/image/Art/2DItems/Currency/ScoutingReport.png',
      [normalizeName("Blighted Scouting Report")]: 'https://web.poecdn.com/image/Art/2DItems/Currency/ScoutingReport.png',
      [normalizeName("Operative's Scouting Report")]: 'https://web.poecdn.com/image/Art/2DItems/Currency/ScoutingReport.png',
      [normalizeName("Comprehensive Scouting Report")]: 'https://web.poecdn.com/image/Art/2DItems/Currency/ScoutingReport.png',
      [normalizeName("Timeless Templar Splinter")]: 'https://web.poecdn.com/image/Art/2DItems/Maps/TemplarShard.png',
      [normalizeName("Timeless Eternal Empire Splinter")]: 'https://web.poecdn.com/image/Art/2DItems/Maps/EternalEmpireShard.png',
      [normalizeName("Timeless Karui Splinter")]: 'https://web.poecdn.com/image/Art/2DItems/Maps/KaruiShard.png',
      [normalizeName("Timeless Maraketh Splinter")]: 'https://web.poecdn.com/image/Art/2DItems/Maps/MarakethShard.png',
      [normalizeName("Annulment Shard")]: 'https://web.poecdn.com/image/Art/2DItems/Currency/AnnullShard.png',
      [normalizeName("Exalted Shard")]: 'https://web.poecdn.com/image/Art/2DItems/Currency/ExaltedShard.png',
      [normalizeName("Hunter's Exalted Orb")]: 'https://web.poecdn.com/image/Art/2DItems/Currency/Influence%20Exalts/BasiliskOrb.png',
    };

    // Combine maps, giving priority to the API's map
    const finalIconMap = { ...manualIconMap, ...iconMap };
    // --- End of manual mapping ---


    // 1. Find all CSV files in the data directory
    console.log('Processing local CSV files...');
    const csvFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));

    let allRows = [];
    const leagueStartDates = new Map();

    // 2. Read and parse each CSV file
    for (const file of csvFiles) {
        const filePath = path.join(dataDir, file);
        const leagueName = file.split('.')[0];
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        const lines = fileContent.split('\n');
        const headerIndex = lines.findIndex(line => line.startsWith('League;Date;Get;Pay;Value;Confidence'));
        if (headerIndex === -1) continue;

        const header = lines[headerIndex];
        const dataLines = lines.slice(headerIndex + 1).join('\n');
        
        const rows = dsvFormat(';').parse(header + '\n' + dataLines);

        if (rows.length > 0) {
            for(const row of rows) {
                if (row.Date) {
                    const date = new Date(row.Date);
                    if (!isNaN(date.getTime())) {
                        leagueStartDates.set(leagueName, date);
                        break;
                    }
                }
            }
        }

        allRows.push(...rows.filter(row => row.Pay === 'Chaos Orb' && row.Value && !isNaN(parseFloat(row.Value))));
    }

    const processed = {};

    const dayDifference = (date1, date2) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        d1.setUTCHours(0, 0, 0, 0);
        d2.setUTCHours(0, 0, 0, 0);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 5. Process all rows to calculate day and price
    allRows.forEach(row => {
        if (!row.Get || !row.League || !row.Date) return;
        const normalizedItemName = normalizeName(row.Get);
        if (!normalizedItemName) return;

        const leagueStartDate = leagueStartDates.get(row.League);
        if (!leagueStartDate) return;

        const currentDate = new Date(row.Date);
        if (isNaN(currentDate.getTime())) return;

        const day = dayDifference(currentDate, leagueStartDate) + 1;

        const price = parseFloat(row.Value);
        if(isNaN(price)) return;

        if (!processed[normalizedItemName]) {
            processed[normalizedItemName] = {
                originalName: row.Get.trim(), // Keep the original name for display
                dailyPrices: {}
            };
        }
        if (!processed[normalizedItemName].dailyPrices[day]) {
            processed[normalizedItemName].dailyPrices[day] = [];
        }
        processed[normalizedItemName].dailyPrices[day].push(price);
    });

    // 6. Calculate averages and format the final data
    const chartData = Object.keys(processed).map(normalizedName => {
        const itemData = processed[normalizedName];
        const values = [];
        for (const day in itemData.dailyPrices) {
            const prices = itemData.dailyPrices[day];
            const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            values.push({
                day: parseInt(day),
                price: averagePrice,
            });
        }
        values.sort((a, b) => a.day - b.day);
        
        const filteredValues = values.filter(v => v.day <= 60);

        return {
            name: itemData.originalName,
            icon: finalIconMap[normalizedName] ?? null,
            values: filteredValues
        };
    });

    // 8. Write to file
    const fileContent = `// This file is auto-generated by scripts/processData.js
export const processedChartData = ${JSON.stringify(chartData, null, 2)};
`;

    fs.writeFileSync(outputFilePath, fileContent, 'utf-8');
    fs.writeFileSync(rawDataFilePath, JSON.stringify(chartData, null, 2), 'utf-8');

    console.log(`Processed data has been written to ${outputFilePath}`);
    console.log(`Raw JSON data has been written to ${rawDataFilePath}`);
}

main();