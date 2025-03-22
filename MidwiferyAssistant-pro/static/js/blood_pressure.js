/**
 * Blood Pressure Monitoring System
 * 
 * This script handles the recording and analysis of blood pressure measurements
 * for pregnancy monitoring and preeclampsia detection.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the form
    const bpForm = document.getElementById('bp-form');
    
    if (bpForm) {
        bpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            evaluateBloodPressure();
        });
    }
    
    // Initialize blood pressure history chart if it exists
    initBPChart();
});

/**
 * Evaluate blood pressure from form and display results
 */
function evaluateBloodPressure() {
    // Show loading state
    const resultContainer = document.getElementById('bp-results');
    if (resultContainer) {
        resultContainer.innerHTML = '<div class="text-center"><div class="loading-spinner"></div><p>Analyse en cours...</p></div>';
    }
    
    // Collect form data
    const formData = {
        systolic: parseInt(document.getElementById('systolic').value) || 0,
        diastolic: parseInt(document.getElementById('diastolic').value) || 0,
        heartRate: document.getElementById('heart-rate').value ? parseInt(document.getElementById('heart-rate').value) : null,
        notes: document.getElementById('notes').value || ''
    };
    
    // Add patient ID if a patient is selected
    const patientSelect = document.getElementById('patientSelect');
    if (patientSelect && patientSelect.value) {
        formData.patientId = patientSelect.value;
    }
    
    // Validate required fields
    if (formData.systolic === 0 || formData.diastolic === 0) {
        showError('Veuillez saisir les valeurs systolique et diastolique.');
        return;
    }
    
    // Validate ranges
    if (formData.systolic < 60 || formData.systolic > 250) {
        showError('La valeur systolique doit être comprise entre 60 et 250 mmHg.');
        return;
    }
    
    if (formData.diastolic < 30 || formData.diastolic > 150) {
        showError('La valeur diastolique doit être comprise entre 30 et 150 mmHg.');
        return;
    }
    
    // Send to API for evaluation
    fetch('/api/record_blood_pressure', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de l\'évaluation de la tension artérielle.');
        }
        return response.json();
    })
    .then(data => {
        displayBPResults(data, formData);
        
        // Update chart if data was saved and chart exists
        if (data.saved && window.bpChart) {
            addDataPointToChart(formData.systolic, formData.diastolic, formData.heartRate);
        }
    })
    .catch(error => {
        showError(error.message);
    });
}

/**
 * Display blood pressure evaluation results
 */
function displayBPResults(results, formData) {
    const resultContainer = document.getElementById('bp-results');
    if (!resultContainer) return;
    
    // Determine status class for styling
    let statusClass = 'success';
    let statusIcon = 'check-circle';
    
    switch (results.status) {
        case 'critical':
            statusClass = 'danger';
            statusIcon = 'exclamation-circle';
            break;
        case 'warning':
            statusClass = 'warning';
            statusIcon = 'exclamation-triangle';
            break;
        case 'mild':
            statusClass = 'warning';
            statusIcon = 'exclamation-triangle';
            break;
        case 'elevated':
            statusClass = 'info';
            statusIcon = 'info-circle';
            break;
        case 'low':
            statusClass = 'info';
            statusIcon = 'arrow-down';
            break;
    }
    
    // Create results HTML
    let html = `
        <div class="card">
            <div class="card-header bg-${statusClass} text-white">
                <h3 class="card-title"><i class="fas fa-${statusIcon}"></i> ${results.message}</h3>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-4 text-center">
                        <h5>Systolique</h5>
                        <span class="display-4">${formData.systolic}</span>
                        <span class="d-block">mmHg</span>
                    </div>
                    <div class="col-md-4 text-center">
                        <h5>Diastolique</h5>
                        <span class="display-4">${formData.diastolic}</span>
                        <span class="d-block">mmHg</span>
                    </div>
                    <div class="col-md-4 text-center">
                        <h5>Fréquence cardiaque</h5>
                        <span class="display-4">${formData.heartRate || '-'}</span>
                        <span class="d-block">bpm</span>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h4>Recommandations</h4>
                    <ul class="list-group">
    `;
    
    if (results.recommendations && results.recommendations.length > 0) {
        results.recommendations.forEach(recommendation => {
            html += `<li class="list-group-item">${recommendation}</li>`;
        });
    } else {
        html += `<li class="list-group-item">Aucune recommandation spécifique nécessaire.</li>`;
    }
    
    html += `
                    </ul>
                </div>
                
                <div class="mt-4">
                    <div class="progress" style="height: 30px;">
                        <div class="progress-bar bg-success" role="progressbar" style="width: 20%;">Normale</div>
                        <div class="progress-bar bg-info" role="progressbar" style="width: 20%;">Élevée</div>
                        <div class="progress-bar bg-warning" role="progressbar" style="width: 20%;">HTA légère</div>
                        <div class="progress-bar bg-warning" role="progressbar" style="width: 20%;">HTA modérée</div>
                        <div class="progress-bar bg-danger" role="progressbar" style="width: 20%;">HTA sévère</div>
                    </div>
                    <div class="d-flex justify-content-between">
                        <small><120/80</small>
                        <small>130/80</small>
                        <small>140/90</small>
                        <small>150/100</small>
                        <small>≥160/110</small>
                    </div>
                </div>
                
                ${results.saved ? 
                    `<div class="alert alert-success mt-4">
                        <i class="fas fa-save"></i> Mesure enregistrée avec succès.
                    </div>` : ''
                }
            </div>
            <div class="card-footer text-center">
                <button type="button" class="btn btn-primary" onclick="window.print()">
                    <i class="fas fa-print"></i> Imprimer
                </button>
            </div>
        </div>
    `;
    
    resultContainer.innerHTML = html;
}

/**
 * Initialize the blood pressure history chart
 */
function initBPChart() {
    const chartCanvas = document.getElementById('bp-chart');
    if (!chartCanvas) return;
    
    // Get the blood pressure history data if available
    const historyData = chartCanvas.dataset.history ? JSON.parse(chartCanvas.dataset.history) : [];
    
    // Prepare data for Chart.js
    const labels = [];
    const systolicData = [];
    const diastolicData = [];
    const heartRateData = [];
    
    historyData.forEach(record => {
        labels.push(record.date);
        systolicData.push(record.systolic);
        diastolicData.push(record.diastolic);
        if (record.heartRate) {
            heartRateData.push(record.heartRate);
        }
    });
    
    // Create the chart
    window.bpChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Systolique (mmHg)',
                    data: systolicData,
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    borderWidth: 2,
                    tension: 0.2,
                    yAxisID: 'y'
                },
                {
                    label: 'Diastolique (mmHg)',
                    data: diastolicData,
                    borderColor: '#2196f3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 2,
                    tension: 0.2,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 40,
                    max: 200,
                    title: {
                        display: true,
                        text: 'Tension artérielle (mmHg)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        criticalLine: {
                            type: 'line',
                            yMin: 160,
                            yMax: 160,
                            borderColor: '#f44336',
                            borderWidth: 2,
                            borderDash: [6, 6],
                            label: {
                                display: true,
                                content: 'Seuil critique (160 mmHg)',
                                position: 'end'
                            }
                        },
                        warningLine: {
                            type: 'line',
                            yMin: 140,
                            yMax: 140,
                            borderColor: '#ff9800',
                            borderWidth: 2,
                            borderDash: [6, 6],
                            label: {
                                display: true,
                                content: 'Seuil d\'HTA (140 mmHg)',
                                position: 'end'
                            }
                        }
                    }
                }
            }
        }
    });
    
    // If heart rate data is available, add it as a separate dataset
    if (heartRateData.length > 0) {
        window.bpChart.data.datasets.push({
            label: 'Fréquence cardiaque (bpm)',
            data: heartRateData,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 2,
            tension: 0.2,
            yAxisID: 'y1'
        });
        
        // Add a second y-axis for heart rate
        window.bpChart.options.scales.y1 = {
            position: 'right',
            beginAtZero: false,
            min: 40,
            max: 180,
            title: {
                display: true,
                text: 'Fréquence cardiaque (bpm)'
            },
            grid: {
                drawOnChartArea: false
            }
        };
        
        window.bpChart.update();
    }
}

/**
 * Add a new data point to the chart
 */
function addDataPointToChart(systolic, diastolic, heartRate) {
    if (!window.bpChart) return;
    
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    window.bpChart.data.labels.push(formattedDate);
    window.bpChart.data.datasets[0].data.push(systolic);
    window.bpChart.data.datasets[1].data.push(diastolic);
    
    if (heartRate && window.bpChart.data.datasets.length > 2) {
        window.bpChart.data.datasets[2].data.push(heartRate);
    }
    
    window.bpChart.update();
}

/**
 * Display error message
 */
function showError(message) {
    const resultContainer = document.getElementById('bp-results');
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> ${message}
            </div>
        `;
    }
}
