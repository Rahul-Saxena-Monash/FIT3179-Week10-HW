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

async function createCharts() {
    try {
        console.log('Loading data...');
        const geoData = await loadAcidificationGeoData();
        const acidificationData = await loadAcidificationData();
        console.log(acidificationData);
        const oceanData = await loadOceanData();
        const graticuleData = await loadGraticuleData();
        console.log('Data loaded successfully');

        const baseChart = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 'container',
            height: 400
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
                },
            ],
            layer: [
                {
                    // Main chart layer
                    mark: 'line',
                    encoding: {
                        x: {
                            field: 'date',
                            type: 'temporal',
                            timeUnit: 'yearmonth',
                            title: 'Date'
                        },
                        y: {
                            field: 'selectedVariable',
                            type: 'quantitative',
                            title: { signal: 'variable' },
                            scale: {
                                zero: false,
                                padding: 0.1
                            }
                        },
                        tooltip: [
                            {
                                field: 'date',
                                type: 'temporal',
                                title: 'Date',
                                format: '%b %d, %Y'
                            },
                            {
                                field: 'selectedVariable',
                                type: 'quantitative',
                                title: 'Selected Variable',
                                format: ',.4f'
                            }
                        ]
                    }
                },
                {
                    // World War I annotation
                    mark: {
                        type: 'rect',
                        color: 'lightgray',
                        opacity: 0.3
                    },
                    data: { values: [{ start: '1914-07-28', end: '1918-11-11' }] },
                    encoding: {
                        x: { field: 'start', type: 'temporal' },
                        x2: { field: 'end', type: 'temporal' }
                    }
                },
                {
                    // World War I text
                    mark: { type: 'text', align: 'center', baseline: 'top', dy: 5 },
                    data: { values: [{ date: '1916-07-01', text: 'World War I' }] },
                    encoding: {
                        x: { field: 'date', type: 'temporal', timeUnit: 'yearmonth' },
                        y: { value: 0 },
                        text: { field: 'text' }
                    }
                },
                {
                    // Great Depression annotation
                    mark: {
                        type: 'rule',
                        color: 'gray',
                        strokeWidth: 1,
                        strokeDash: [4, 4]
                    },
                    data: { values: [{ date: '1929-10-29' }] },
                    encoding: {
                        x: { field: 'date', type: 'temporal', timeUnit: 'yearmonth' }
                    }
                },
                {
                    // Great Depression text
                    mark: { type: 'text', align: 'left', baseline: 'middle', dx: 5 },
                    data: { values: [{ date: '1929-10-29', text: 'Great Depression' }] },
                    encoding: {
                        x: { field: 'date', type: 'temporal', timeUnit: 'yearmonth' },
                        y: { value: 20 },
                        text: { field: 'text' }
                    }
                },
                {
                    // Keeling Curve annotation
                    mark: { type: 'rule', color: 'green', },
                    data: { values: [{ date: '1958-03-01' }] },
                    encoding: {
                        x: { field: 'date', type: 'temporal', timeUnit: 'yearmonth' }
                    }
                },
                {
                    // Keeling Curve text
                    mark: { type: 'text', align: 'left', baseline: 'middle', dx: 5 },
                    data: { values: [{ date: '1958-03-01', text: 'Keeling Curve measurements begin' }] },
                    encoding: {
                        x: { field: 'date', type: 'temporal', timeUnit: 'yearmonth' },
                        y: { value: 20 },
                        text: { field: 'text' }
                    }
                }
            ]
        };

        console.log('Rendering chart...');
        const chartElement = document.getElementById('ph-deviation-map');
        if (!chartElement) {
            console.error('Chart element not found in the DOM');
            return;
        }
        await vegaEmbed('#ph-deviation-map', phDeviationChart, { actions: false });
        await vegaEmbed('#time-series', timeSeriesChart, { actions: false });
        console.log('Chart rendered successfully');
    } catch (error) {
        console.error('Error creating charts:', error);
    }
}

document.addEventListener('DOMContentLoaded', createCharts);