async function loadAcidificationGeoData() {
    try {
        const response = await fetch('./ocean_acidification_geo.json');
        return await response.json();
    } catch (error) {
        console.error('Error loading acidification geo data:', error);
    }
}

async function loadAcidificationData() {
    const response = await fetch('./ocean_acidification_data.json');
    return await response.json();
}

async function loadOceanData() {
    const response = await fetch('./ne_110m_ocean.json');
    return await response.json();
}

async function loadGraticuleData() {
    const response = await fetch('./ne_110m_graticules_30.json');
    return await response.json();
}

function chartDimensions() {
    return {
        width: Math.max(300, window.innerWidth * 0.88),
        height: Math.max(200, window.innerWidth * 0.5)
    }
}

async function createCharts() {
    try {
        const { width, height } = chartDimensions();

        console.log('Loading data...');
        const geoData = await loadAcidificationGeoData();
        const acidificationData = await loadAcidificationData();
        console.log(acidificationData);
        const oceanData = await loadOceanData();
        const graticuleData = await loadGraticuleData();
        console.log('Data loaded successfully');

        const baseChart = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: width,
            height: height
        }

        const phDeviationChart = {
            ...baseChart,
            projection: {
                type: 'conicEqualArea',
                center: [0, -25],
                rotate: [-133, 0, 0],
                scale: 600,
            },
            layer: [
                {
                    data: { values: oceanData.features },
                    mark: { type: 'geoshape', fill: 'lightgray' },
                },
                {
                    data: { values: graticuleData.features },
                    mark: { type: 'geoshape', stroke: 'gray', strokeWidth: 0.5, filled: false },
                },
                {
                    data: { values: geoData.features },
                    mark: { type: 'circle', opacity: 0.8 },
                    encoding: {
                        longitude: { field: 'geometry.coordinates.0', type: 'quantitative' },
                        latitude: { field: 'geometry.coordinates.1', type: 'quantitative' },
                        color: {
                            field: 'properties.pH_deviation',
                            type: 'quantitative',
                            title: 'pH Deviation',
                            scale: {
                                domain: [-0.1, -0.05, 0, 0.05, 0.1],
                                range: ['#d73027', '#fc8d59', '#e0e0e0', '#91bfdb', '#4575b4']
                            }
                        },
                        size: { value: 20 },
                        tooltip: [
                            { field: "geometry.coordinates.1", type: "quantitative", title: "Latitude" },
                            { field: "geometry.coordinates.0", type: "quantitative", title: "Longitude" },
                            { field: "properties.pH_deviation", type: "quantitative", title: "pH deviation" }
                        ]
                    }
                }
            ]
        };

        const timeSeriesChart = {
            ...baseChart,
            data: { values: acidificationData },
            mark: 'line',
            params: [
                {
                    name: 'variable', // Name of the parameter
                    value: 'pH_T', // Default selected value
                    bind: {
                        input: 'select', // Create a dropdown selector
                        options: ['pH_T', 'SST', 'SSS', 'OMEGA_A', 'OMEGA_C', 'pH_deviation'], // Variables to select from
                        labels: ['pH_T', 'SST', 'SSS', 'Omega Aragonite', 'Omega Calcite', 'pH Deviation'] // Dropdown labels
                    }
                }
            ],
            transform: [
                {
                    calculate: 'datum[variable]',
                    as: 'selectedVariable'
                }
            ],
            encoding: {
                x: {
                    field: 'date',
                    type: 'temporal',
                    timeUnit: 'yearmonth', // Add time unit to ensure proper date parsing
                    title: 'Date'
                },
                y: {
                    field: 'selectedVariable', // Default to pH_T
                    type: 'quantitative',
                    title: { signal: 'variable' }
                },
                tooltip: [
                    { field: 'date', type: 'temporal', title: 'Date' },
                    { field: 'selectedVariable', type: 'quantitative', title: { expr: "params.variable" } }
                ]
            }
        };


        console.log('Rendering chart...');
        const chartElement = document.getElementById('ph-deviation-map');
        if (!chartElement) {
            console.error('Chart element not found in the DOM');
            return;
        }
        await vegaEmbed('#ph-deviation-map', phDeviationChart);
        await vegaEmbed('#time-series', timeSeriesChart);
        console.log('Chart rendered successfully');
    } catch (error) {
        console.error('Error creating charts:', error);
    }
}

document.addEventListener('DOMContentLoaded', createCharts);
window.addEventListener('resize', createCharts);