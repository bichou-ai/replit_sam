/**
 * Ultrasound Reference and Analysis System
 * 
 * This script provides reference data for fetal biometry and
 * analyzes ultrasound measurements.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the ultrasound form
    const ultrasoundForm = document.getElementById('ultrasound-form');
    
    if (ultrasoundForm) {
        ultrasoundForm.addEventListener('submit', function(e) {
            e.preventDefault();
            analyzeUltrasoundData();
        });
    }
    
    // Initialize gestational age selector
    const gaSelector = document.getElementById('gestational-age');
    if (gaSelector) {
        gaSelector.addEventListener('change', function() {
            updateReferenceValues(this.value);
        });
        
        // Initialize with default value
        if (gaSelector.value) {
            updateReferenceValues(gaSelector.value);
        }
    }
    
    // Initialize growth chart if it exists
    initGrowthChart();
});

/**
 * Update reference values based on selected gestational age
 */
function updateReferenceValues(gestationalAge) {
    // Get reference data for the selected gestational age
    fetch(`/static/js/ultrasound_reference.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des valeurs de référence.');
            }
            return response.json();
        })
        .then(data => {
            if (data[gestationalAge]) {
                const reference = data[gestationalAge];
                
                // Update reference value displays
                updateReferenceDisplay('bpd-reference', reference.bpd);
                updateReferenceDisplay('hc-reference', reference.hc);
                updateReferenceDisplay('ac-reference', reference.ac);
                updateReferenceDisplay('fl-reference', reference.fl);
                
                // Update estimated weight if provided
                if (reference.efw) {
                    updateReferenceDisplay('efw-reference', reference.efw);
                }
            } else {
                console.error('Données de référence non disponibles pour cet âge gestationnel.');
            }
        })
        .catch(error => {
            console.error(error);
        });
}

/**
 * Update reference value display
 */
function updateReferenceDisplay(elementId, values) {
    const element = document.getElementById(elementId);
    if (element && values) {
        element.textContent = `${values[0]} (${values[1]}-${values[2]})`;
        element.parentElement.classList.remove('d-none');
    } else if (element) {
        element.parentElement.classList.add('d-none');
    }
}

/**
 * Initialize fetal growth chart
 */
function initGrowthChart() {
    const chartCanvas = document.getElementById('growth-chart');
    if (!chartCanvas) return;
    
    // Load reference data for chart
    fetch(`/static/js/ultrasound_growth_chart.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des données de croissance.');
            }
            return response.json();
        })
        .then(data => {
            createGrowthChart(chartCanvas, data);
        })
        .catch(error => {
            console.error(error);
            const chartContainer = chartCanvas.parentElement;
            chartContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> Impossible de charger les données de croissance.
                </div>
            `;
        });
}

/**
 * Create fetal growth chart with reference curves
 */
function createGrowthChart(canvas, data) {
    // Get the selected measurement type
    const measurementType = canvas.dataset.measurement || 'efw';
    
    // Prepare chart data
    const weeks = data.weeks;
    const p5 = data[measurementType].p5;
    const p50 = data[measurementType].p50;
    const p95 = data[measurementType].p95;
    
    // Get patient data if available
    const patientDataStr = canvas.dataset.patientData;
    const patientData = patientDataStr ? JSON.parse(patientDataStr) : [];
    
    // Chart configuration
    const chartConfig = {
        type: 'line',
        data: {
            labels: weeks,
            datasets: [
                {
                    label: '5e percentile',
                    data: p5,
                    borderColor: '#90caf9',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: '50e percentile',
                    data: p50,
                    borderColor: '#1976d2',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: '95e percentile',
                    data: p95,
                    borderColor: '#90caf9',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Semaines d\'aménorrhée'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: getMeasurementLabel(measurementType)
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    };
    
    // Add patient data if available
    if (patientData.length > 0) {
        chartConfig.data.datasets.push({
            label: 'Mesures du fœtus',
            data: patientData.map(d => ({
                x: d.week,
                y: d.value
            })),
            borderColor: '#e91e63',
            backgroundColor: 'rgba(233, 30, 99, 0.2)',
            borderWidth: 2,
            pointRadius: 6,
            pointBackgroundColor: '#e91e63',
            fill: false
        });
    }
    
    // Create chart
    window.growthChart = new Chart(canvas, chartConfig);
}

/**
 * Get human-readable label for measurement type
 */
function getMeasurementLabel(type) {
    switch (type) {
        case 'bpd':
            return 'Diamètre bipariétal (mm)';
        case 'hc':
            return 'Circonférence de la tête (mm)';
        case 'ac':
            return 'Circonférence abdominale (mm)';
        case 'fl':
            return 'Longueur fémorale (mm)';
        case 'efw':
            return 'Poids estimé (g)';
        default:
            return 'Mesure (mm)';
    }
}

/**
 * Analyze ultrasound measurements
 */
function analyzeUltrasoundData() {
    // Show loading state
    const resultContainer = document.getElementById('ultrasound-results');
    if (resultContainer) {
        resultContainer.innerHTML = '<div class="text-center"><div class="loading-spinner"></div><p>Analyse en cours...</p></div>';
    }
    
    // Get form data
    const gestationalAge = parseInt(document.getElementById('gestational-age').value);
    const bpd = parseFloat(document.getElementById('bpd').value) || 0;
    const hc = parseFloat(document.getElementById('hc').value) || 0;
    const ac = parseFloat(document.getElementById('ac').value) || 0;
    const fl = parseFloat(document.getElementById('fl').value) || 0;
    const afIndex = parseFloat(document.getElementById('af-index').value) || 0;
    const placentaLocation = document.getElementById('placenta-location').value;
    const notes = document.getElementById('notes').value;
    
    // Validate inputs
    if (gestationalAge < 12 || gestationalAge > 40) {
        showError('L\'âge gestationnel doit être compris entre 12 et 40 semaines.');
        return;
    }
    
    if (bpd === 0 && hc === 0 && ac === 0 && fl === 0) {
        showError('Veuillez saisir au moins une mesure biométrique.');
        return;
    }
    
    // Get patient ID if available
    const patientId = document.getElementById('patient-id') ? 
                      document.getElementById('patient-id').value : null;
    
    // Build request data
    const requestData = {
        gestationalAge: gestationalAge,
        measurements: {
            bpd: bpd,
            hc: hc,
            ac: ac,
            fl: fl,
            afIndex: afIndex,
            placentaLocation: placentaLocation
        },
        notes: notes,
        patientId: patientId
    };
    
    // For this demo, we'll analyze locally
    // In a real implementation, you would send this to the server
    const analysisResults = analyzeUltrasoundLocally(requestData);
    displayUltrasoundResults(analysisResults, requestData);
}

/**
 * Locally analyze ultrasound data (simplified version)
 * In a real implementation, this would be server-side
 */
function analyzeUltrasoundLocally(data) {
    const ga = data.gestationalAge;
    const measurements = data.measurements;
    
    // Estimated fetal weight using Hadlock formula (simplified)
    let efw = 0;
    if (measurements.ac > 0 && measurements.fl > 0) {
        // Simplified Hadlock formula
        efw = Math.pow(10, (1.304 + 0.05281 * measurements.ac + 0.1938 * measurements.fl - 0.004 * measurements.ac * measurements.fl));
        efw = Math.round(efw);
    }
    
    // Analyze individual measurements (simplified)
    const results = {
        efw: efw,
        percentiles: {},
        concerns: [],
        recommendations: []
    };
    
    // Add common recommendations based on gestational age
    if (ga < 20) {
        results.recommendations.push("Confirmer la vitalité et l'âge gestationnel");
        results.recommendations.push("Évaluer l'anatomie fœtale");
    } else if (ga >= 20 && ga < 24) {
        results.recommendations.push("Évaluation morphologique détaillée");
        results.recommendations.push("Vérifier la position placentaire");
    } else if (ga >= 24 && ga < 34) {
        results.recommendations.push("Surveillance de la croissance fœtale");
        results.recommendations.push("Évaluation du col utérin si risque de prématurité");
    } else {
        results.recommendations.push("Vérifier la présentation fœtale");
        results.recommendations.push("Évaluation du bien-être fœtal");
        results.recommendations.push("Estimer le poids fœtal");
    }
    
    // Add specific recommendations based on AFI
    if (measurements.afIndex < 5) {
        results.concerns.push("Oligoamnios (AFI < 5 cm)");
        results.recommendations.push("Rechercher une rupture des membranes");
        results.recommendations.push("Évaluer la fonction rénale fœtale");
    } else if (measurements.afIndex > 25) {
        results.concerns.push("Hydramnios (AFI > 25 cm)");
        results.recommendations.push("Rechercher une anomalie fœtale");
        results.recommendations.push("Dépistage diabète gestationnel");
    }
    
    // Add placenta concerns if applicable
    if (measurements.placentaLocation.includes("praevia") || 
        measurements.placentaLocation.includes("bas") || 
        measurements.placentaLocation.includes("bas-inséré")) {
        results.concerns.push("Placenta bas-inséré ou praevia");
        results.recommendations.push("Contrôle échographique à 32 SA");
    }
    
    return results;
}

/**
 * Display ultrasound analysis results
 */
function displayUltrasoundResults(results, requestData) {
    const resultContainer = document.getElementById('ultrasound-results');
    if (!resultContainer) return;
    
    // Create results HTML
    let html = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Résultats de l'analyse échographique</h3>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h4>Mesures biométriques</h4>
                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Paramètre</th>
                                    <th>Valeur</th>
                                </tr>
                            </thead>
                            <tbody>
    `;
    
    // Add measurement rows
    if (requestData.measurements.bpd > 0) {
        html += `<tr><td>Diamètre bipariétal (BPD)</td><td>${requestData.measurements.bpd} mm</td></tr>`;
    }
    if (requestData.measurements.hc > 0) {
        html += `<tr><td>Circonférence crânienne (HC)</td><td>${requestData.measurements.hc} mm</td></tr>`;
    }
    if (requestData.measurements.ac > 0) {
        html += `<tr><td>Circonférence abdominale (AC)</td><td>${requestData.measurements.ac} mm</td></tr>`;
    }
    if (requestData.measurements.fl > 0) {
        html += `<tr><td>Longueur fémorale (FL)</td><td>${requestData.measurements.fl} mm</td></tr>`;
    }
    if (requestData.measurements.afIndex > 0) {
        html += `<tr><td>Index de liquide amniotique (AFI)</td><td>${requestData.measurements.afIndex} cm</td></tr>`;
    }
    if (requestData.measurements.placentaLocation) {
        html += `<tr><td>Localisation placentaire</td><td>${requestData.measurements.placentaLocation}</td></tr>`;
    }
    
    // Add estimated fetal weight if calculated
    if (results.efw > 0) {
        html += `<tr><td>Poids fœtal estimé (EFW)</td><td>${results.efw} g</td></tr>`;
    }
    
    html += `
                            </tbody>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h4>Interprétation</h4>
    `;
    
    // Add concerns if any
    if (results.concerns && results.concerns.length > 0) {
        html += `
            <div class="alert alert-warning">
                <h5><i class="fas fa-exclamation-triangle"></i> Points d'attention</h5>
                <ul>
        `;
        
        results.concerns.forEach(concern => {
            html += `<li>${concern}</li>`;
        });
        
        html += `
                </ul>
            </div>
        `;
    } else {
        html += `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i> Aucune anomalie majeure détectée.
            </div>
        `;
    }
    
    // Add recommendations
    html += `
        <h5 class="mt-3">Recommandations</h5>
        <ul class="list-group">
    `;
    
    if (results.recommendations && results.recommendations.length > 0) {
        results.recommendations.forEach(recommendation => {
            html += `<li class="list-group-item">${recommendation}</li>`;
        });
    } else {
        html += `<li class="list-group-item">Aucune recommandation spécifique.</li>`;
    }
    
    html += `
                        </ul>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h4>Âge gestationnel et croissance</h4>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> L'examen a été réalisé à ${requestData.gestationalAge} semaines d'aménorrhée.
                    </div>
                </div>
            </div>
            <div class="card-footer text-center">
                <button type="button" class="btn btn-primary" onclick="window.print()">
                    <i class="fas fa-print"></i> Imprimer
                </button>
                <button type="button" class="btn btn-outline-primary" id="save-ultrasound">
                    <i class="fas fa-save"></i> Enregistrer
                </button>
            </div>
        </div>
    `;
    
    resultContainer.innerHTML = html;
    
    // Add event listener to save button
    const saveButton = document.getElementById('save-ultrasound');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            alert('Cette fonctionnalité sera disponible dans une prochaine mise à jour.');
        });
    }
}

/**
 * Display error message
 */
function showError(message) {
    const resultContainer = document.getElementById('ultrasound-results');
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> ${message}
            </div>
        `;
    }
}
