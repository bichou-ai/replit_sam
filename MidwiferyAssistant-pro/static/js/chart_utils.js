/**
 * Chart Utilities
 * 
 * This script provides common chart configuration and helper functions
 * for data visualization throughout the application.
 */

/**
 * Configure common Chart.js defaults
 */
function configureChartDefaults() {
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = "'Roboto', 'Open Sans', sans-serif";
        Chart.defaults.color = '#5f6368';
        Chart.defaults.elements.line.borderWidth = 2;
        Chart.defaults.elements.point.radius = 3;
        Chart.defaults.elements.point.hoverRadius = 5;
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(32, 33, 36, 0.8)';
        Chart.defaults.plugins.tooltip.titleFont = { weight: 'bold' };
        Chart.defaults.plugins.legend.position = 'top';
    }
}

/**
 * Create a responsive chart container
 * 
 * @param {string} containerId - ID of the container element
 * @param {string} chartId - ID to assign to the new canvas element
 * @param {number} height - Optional height for the chart container
 * @returns {HTMLCanvasElement} The created canvas element
 */
function createChartContainer(containerId, chartId, height = 300) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Set container height
    container.style.height = `${height}px`;
    container.classList.add('chart-container');
    
    // Create and append canvas
    const canvas = document.createElement('canvas');
    canvas.id = chartId;
    container.appendChild(canvas);
    
    return canvas;
}

/**
 * Create a line chart
 * 
 * @param {string} canvasId - ID of the canvas element
 * @param {Array} labels - X-axis labels
 * @param {Array} datasets - Chart datasets
 * @param {Object} options - Chart options
 * @returns {Chart} The created chart
 */
function createLineChart(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    // Apply default options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false
            }
        }
    };
    
    // Merge default options with provided options
    const chartOptions = { ...defaultOptions, ...options };
    
    // Create and return chart
    return new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: chartOptions
    });
}

/**
 * Create a bar chart
 * 
 * @param {string} canvasId - ID of the canvas element
 * @param {Array} labels - X-axis labels
 * @param {Array} datasets - Chart datasets
 * @param {Object} options - Chart options
 * @returns {Chart} The created chart
 */
function createBarChart(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    // Apply default options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false
            }
        }
    };
    
    // Merge default options with provided options
    const chartOptions = { ...defaultOptions, ...options };
    
    // Create and return chart
    return new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: chartOptions
    });
}

/**
 * Format date for chart display
 * 
 * @param {Date|string} date - Date to format
 * @param {boolean} includeTime - Whether to include time in the formatted output
 * @returns {string} Formatted date string
 */
function formatChartDate(date, includeTime = false) {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return dateObj.toLocaleDateString('fr-FR', options);
}

/**
 * Create color scheme for charts
 * 
 * @param {number} count - Number of colors needed
 * @param {string} scheme - Color scheme name (primary, rainbow, pastel)
 * @returns {Array} Array of color values
 */
function createColorScheme(count, scheme = 'primary') {
    const colorSchemes = {
        primary: ['#1a73e8', '#34a853', '#ea4335', '#fbbc05', '#4285f4', '#46bdc6', '#7baaf7', '#4ecb71'],
        rainbow: ['#f44336', '#ff9800', '#ffc107', '#4caf50', '#03a9f4', '#3f51b5', '#9c27b0', '#e91e63'],
        pastel: ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#e3baff', '#baffed', '#f5baff']
    };
    
    let colors = colorSchemes[scheme] || colorSchemes.primary;
    
    // If we need more colors than available in the scheme, repeat the pattern
    if (count > colors.length) {
        const repeats = Math.ceil(count / colors.length);
        const originalColors = [...colors];
        
        for (let i = 1; i < repeats; i++) {
            colors = colors.concat(originalColors);
        }
    }
    
    // Return the requested number of colors
    return colors.slice(0, count);
}

/**
 * Add reference line to chart
 * 
 * @param {Chart} chart - Chart.js instance
 * @param {number} value - Y-axis value for the line
 * @param {string} label - Label for the line
 * @param {string} color - Line color
 */
function addReferenceLineToChart(chart, value, label, color = '#f44336') {
    if (!chart || !chart.options || !chart.options.plugins) return;
    
    // Initialize annotations plugin if not exists
    if (!chart.options.plugins.annotation) {
        chart.options.plugins.annotation = {
            annotations: {}
        };
    }
    
    // Create unique ID for the annotation
    const annotationId = `line_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add the reference line
    chart.options.plugins.annotation.annotations[annotationId] = {
        type: 'line',
        yMin: value,
        yMax: value,
        borderColor: color,
        borderWidth: 2,
        borderDash: [6, 6],
        label: {
            display: true,
            content: label,
            position: 'end'
        }
    };
    
    // Update the chart
    chart.update();
}

/**
 * Add zone highlight to chart
 * 
 * @param {Chart} chart - Chart.js instance
 * @param {number} min - Minimum Y-axis value
 * @param {number} max - Maximum Y-axis value
 * @param {string} label - Label for the zone
 * @param {string} color - Zone color
 */
function addZoneHighlightToChart(chart, min, max, label, color = 'rgba(255, 152, 0, 0.2)') {
    if (!chart || !chart.options || !chart.options.plugins) return;
    
    // Initialize annotations plugin if not exists
    if (!chart.options.plugins.annotation) {
        chart.options.plugins.annotation = {
            annotations: {}
        };
    }
    
    // Create unique ID for the annotation
    const annotationId = `box_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add the zone highlight
    chart.options.plugins.annotation.annotations[annotationId] = {
        type: 'box',
        yMin: min,
        yMax: max,
        backgroundColor: color,
        borderWidth: 0,
        label: {
            display: label ? true : false,
            content: label || '',
            position: 'center'
        }
    };
    
    // Update the chart
    chart.update();
}

/**
 * Update chart data and refresh
 * 
 * @param {Chart} chart - Chart.js instance
 * @param {Array} labels - New X-axis labels
 * @param {Array} datasets - New datasets
 */
function updateChartData(chart, labels, datasets) {
    if (!chart) return;
    
    chart.data.labels = labels;
    
    // Update each dataset
    datasets.forEach((dataset, i) => {
        if (chart.data.datasets[i]) {
            chart.data.datasets[i].data = dataset.data;
            
            // Update other properties if provided
            if (dataset.label) chart.data.datasets[i].label = dataset.label;
            if (dataset.borderColor) chart.data.datasets[i].borderColor = dataset.borderColor;
            if (dataset.backgroundColor) chart.data.datasets[i].backgroundColor = dataset.backgroundColor;
        }
    });
    
    // Update the chart
    chart.update();
}

// Initialize Chart.js defaults when script loads
document.addEventListener('DOMContentLoaded', function() {
    configureChartDefaults();
});
