/**
 * Biomedical Analysis Interpretation System
 * 
 * This script handles the interpretation of blood test results and other
 * biomedical parameters for pregnancy monitoring.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the form
    const analyzeForm = document.getElementById('biomedical-form');
    
    if (analyzeForm) {
        analyzeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            analyzeBiomedicalData();
        });
    }
    
    // Initialize patient selection if available
    const patientSelect = document.getElementById('patientSelect');
    if (patientSelect) {
        patientSelect.addEventListener('change', function() {
            // This would typically load patient data if selected
            // For now, it's just showing/hiding the save option
            const saveOption = document.getElementById('save-results-option');
            if (saveOption) {
                saveOption.style.display = this.value ? 'block' : 'none';
            }
        });
    }
});

/**
 * Analyze biomedical data from form and display results
 */
function analyzeBiomedicalData() {
    // Show loading state
    const resultContainer = document.getElementById('analysis-results');
    if (resultContainer) {
        resultContainer.innerHTML = '<div class="text-center"><div class="loading-spinner"></div><p>Analyse en cours...</p></div>';
    }
    
    // Collect form data
    const formData = {
        hemoglobin: parseFloat(document.getElementById('hemoglobin').value) || 0,
        platelets: parseInt(document.getElementById('platelets').value) || 0,
        ferritin: document.getElementById('ferritin').value ? parseFloat(document.getElementById('ferritin').value) : null,
        hematocrit: document.getElementById('hematocrit').value ? parseFloat(document.getElementById('hematocrit').value) : null,
        ldh: document.getElementById('ldh').value ? parseFloat(document.getElementById('ldh').value) : null,
        alt: document.getElementById('alt').value ? parseFloat(document.getElementById('alt').value) : null,
        ast: document.getElementById('ast').value ? parseFloat(document.getElementById('ast').value) : null,
        notes: document.getElementById('notes').value || ''
    };
    
    // Add patient ID if a patient is selected
    const patientSelect = document.getElementById('patientSelect');
    const saveResults = document.getElementById('save-results');
    
    if (patientSelect && patientSelect.value && saveResults && saveResults.checked) {
        formData.patientId = patientSelect.value;
    }
    
    // Validate required fields
    if (formData.hemoglobin === 0 && formData.platelets === 0) {
        showError('Veuillez saisir au moins une valeur d\'hémoglobine ou de plaquettes.');
        return;
    }
    
    // Send to API for analysis
    fetch('/api/analyze_blood_results', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de l\'analyse des résultats.');
        }
        return response.json();
    })
    .then(data => {
        displayBiomedicalResults(data, formData);
    })
    .catch(error => {
        showError(error.message);
    });
}

/**
 * Display biomedical analysis results
 */
function displayBiomedicalResults(results, formData) {
    const resultContainer = document.getElementById('analysis-results');
    if (!resultContainer) return;
    
    // Create results HTML
    let html = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3 class="card-title">Résultats de l'analyse</h3>
                <span class="badge badge-${getStatusClass(results.overall.status)}">${results.overall.message}</span>
            </div>
            <div class="card-body">
                <div class="row">
    `;
    
    // Add hemoglobin section if provided
    if (formData.hemoglobin > 0) {
        html += `
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Hémoglobine</h5>
                        <span class="badge badge-${getStatusClass(results.hemoglobin.status)}">${results.hemoglobin.status}</span>
                    </div>
                    <div class="card-body">
                        <div class="text-center mb-3">
                            <span class="display-4 status-${results.hemoglobin.status}">${formData.hemoglobin} g/dL</span>
                        </div>
                        <p class="text-center">${results.hemoglobin.message}</p>
                        
                        <div class="progress mt-3">
                            <div class="progress-bar bg-${getProgressBarColor(formData.hemoglobin, 7, 12)}" 
                                 role="progressbar" 
                                 style="width: ${getProgressBarWidth(formData.hemoglobin, 7, 14)}%">
                            </div>
                        </div>
                        <div class="d-flex justify-content-between mt-1">
                            <small class="text-danger">Faible</small>
                            <small class="text-success">Normal</small>
                            <small class="text-danger">Élevé</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Add platelets section if provided
    if (formData.platelets > 0) {
        html += `
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Plaquettes</h5>
                        <span class="badge badge-${getStatusClass(results.platelets.status)}">${results.platelets.status}</span>
                    </div>
                    <div class="card-body">
                        <div class="text-center mb-3">
                            <span class="display-4 status-${results.platelets.status}">${formData.platelets} × 10⁹/L</span>
                        </div>
                        <p class="text-center">${results.platelets.message}</p>
                        
                        <div class="progress mt-3">
                            <div class="progress-bar bg-${getProgressBarColor(formData.platelets, 50, 400)}" 
                                 role="progressbar" 
                                 style="width: ${getProgressBarWidth(formData.platelets, 0, 500)}%">
                            </div>
                        </div>
                        <div class="d-flex justify-content-between mt-1">
                            <small class="text-danger">Faible</small>
                            <small class="text-success">Normal</small>
                            <small class="text-danger">Élevé</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Add ferritin section if provided
    if (formData.ferritin && results.ferritin) {
        html += `
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Ferritine</h5>
                        <span class="badge badge-${getStatusClass(results.ferritin.status)}">${results.ferritin.status}</span>
                    </div>
                    <div class="card-body">
                        <div class="text-center mb-3">
                            <span class="display-4 status-${results.ferritin.status}">${formData.ferritin} μg/L</span>
                        </div>
                        <p class="text-center">${results.ferritin.message}</p>
                        
                        <div class="progress mt-3">
                            <div class="progress-bar bg-${getProgressBarColor(formData.ferritin, 15, 150)}" 
                                 role="progressbar" 
                                 style="width: ${getProgressBarWidth(formData.ferritin, 0, 200)}%">
                            </div>
                        </div>
                        <div class="d-flex justify-content-between mt-1">
                            <small class="text-danger">Faible</small>
                            <small class="text-success">Normal</small>
                            <small class="text-danger">Élevé</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Add LDH section if provided
    if (formData.ldh && results.ldh) {
        html += `
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">LDH</h5>
                        <span class="badge badge-${getStatusClass(results.ldh.status)}">${results.ldh.status}</span>
                    </div>
                    <div class="card-body">
                        <div class="text-center mb-3">
                            <span class="display-4 status-${results.ldh.status}">${formData.ldh} U/L</span>
                        </div>
                        <p class="text-center">${results.ldh.message}</p>
                        
                        <div class="progress mt-3">
                            <div class="progress-bar bg-${getProgressBarColor(formData.ldh, 140, 600)}" 
                                 role="progressbar" 
                                 style="width: ${getProgressBarWidth(formData.ldh, 100, 800)}%">
                            </div>
                        </div>
                        <div class="d-flex justify-content-between mt-1">
                            <small class="text-danger">Faible</small>
                            <small class="text-success">Normal</small>
                            <small class="text-danger">Élevé</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Add liver enzymes section if provided
    if ((formData.alt || formData.ast) && results.liver_enzymes) {
        html += `
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Enzymes hépatiques</h5>
                        <span class="badge badge-${getStatusClass(results.liver_enzymes.status)}">${results.liver_enzymes.status}</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6 text-center">
                                <h6>ALT/SGPT</h6>
                                <span class="h4">${formData.alt || 'N/A'} U/L</span>
                            </div>
                            <div class="col-6 text-center">
                                <h6>AST/SGOT</h6>
                                <span class="h4">${formData.ast || 'N/A'} U/L</span>
                            </div>
                        </div>
                        <p class="text-center mt-3">${results.liver_enzymes.message}</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Close row and add recommendations
    html += `
                </div>
                
                <div class="mt-4">
                    <h4>Recommandations cliniques</h4>
                    <ul class="list-group">
    `;
    
    if (results.overall.recommendations && results.overall.recommendations.length > 0) {
        results.overall.recommendations.forEach(recommendation => {
            html += `<li class="list-group-item">${recommendation}</li>`;
        });
    } else {
        html += `<li class="list-group-item">Aucune recommandation spécifique nécessaire.</li>`;
    }
    
    html += `
                    </ul>
                </div>
                
                ${results.overall.status === 'critical' ? 
                    `<div class="alert alert-danger mt-4">
                        <i class="fas fa-exclamation-circle"></i> <strong>Attention :</strong> Ces résultats nécessitent une attention médicale immédiate.
                    </div>` : ''
                }
                
                ${results.overall.status === 'warning' ? 
                    `<div class="alert alert-warning mt-4">
                        <i class="fas fa-exclamation-triangle"></i> <strong>Attention :</strong> Ces résultats nécessitent un suivi médical rapproché.
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
 * Returns the appropriate status class for Bootstrap styling
 */
function getStatusClass(status) {
    switch (status) {
        case 'critical':
            return 'danger';
        case 'warning':
            return 'warning';
        case 'mild':
            return 'info';
        case 'normal':
            return 'success';
        default:
            return 'secondary';
    }
}

/**
 * Calculate progress bar color based on value and normal range
 */
function getProgressBarColor(value, min, max) {
    if (value < min) {
        return 'danger';
    } else if (value > max) {
        return 'danger';
    } else {
        return 'success';
    }
}

/**
 * Calculate progress bar width as percentage
 */
function getProgressBarWidth(value, minScale, maxScale) {
    // Ensure value is within scale
    value = Math.max(minScale, Math.min(value, maxScale));
    // Calculate percentage
    return ((value - minScale) / (maxScale - minScale)) * 100;
}

/**
 * Display error message
 */
function showError(message) {
    const resultContainer = document.getElementById('analysis-results');
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> ${message}
            </div>
        `;
    }
}
