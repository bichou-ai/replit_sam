/**
 * Gestational Age Calculator
 * 
 * This script handles the calculation of gestational age based on
 * the last menstrual period date and cycle length.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as the default for the last period input
    const lastPeriodInput = document.getElementById('lastPeriod');
    if (lastPeriodInput) {
        const today = new Date();
        const formattedDate = today.toISOString().substring(0, 10);
        lastPeriodInput.value = formattedDate;
    }
    
    // Set default cycle length from user preferences if available
    const cycleLengthInput = document.getElementById('cycleLength');
    if (cycleLengthInput && cycleLengthInput.dataset.default) {
        cycleLengthInput.value = cycleLengthInput.dataset.default;
    }
    
    // Add event listener to calculate button
    const calculateButton = document.getElementById('calculateButton');
    if (calculateButton) {
        calculateButton.addEventListener('click', calculateGestationalAge);
    }
});

/**
 * Calculate gestational age and display results
 */
function calculateGestationalAge() {
    // Show loading state
    const resultContainer = document.getElementById('resultContainer');
    if (resultContainer) {
        resultContainer.innerHTML = '<div class="text-center"><div class="loading-spinner"></div><p>Calcul en cours...</p></div>';
    }
    
    // Get input values
    const lastPeriod = document.getElementById('lastPeriod').value;
    const cycleLength = document.getElementById('cycleLength').value || 28;
    
    // Validate inputs
    if (!lastPeriod) {
        showError('Veuillez saisir la date des dernières règles.');
        return;
    }
    
    if (cycleLength < 20 || cycleLength > 45) {
        showError('La longueur du cycle doit être comprise entre 20 et 45 jours.');
        return;
    }
    
    // Send request to API
    fetch('/api/calculate_gestational_age', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            lastPeriod: lastPeriod,
            cycleLength: parseInt(cycleLength, 10)
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors du calcul de l\'âge gestationnel.');
        }
        return response.json();
    })
    .then(data => {
        displayResults(data);
    })
    .catch(error => {
        showError(error.message);
    });
}

/**
 * Display calculation results
 */
function displayResults(data) {
    const resultContainer = document.getElementById('resultContainer');
    if (!resultContainer) return;
    
    // Create results HTML
    let html = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Résultats du calcul</h3>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col">
                        <h4 class="text-center">Âge gestationnel</h4>
                        <p class="text-center display-4">${data.weeks} SA + ${data.days} jours</p>
                    </div>
                    <div class="col">
                        <h4 class="text-center">Date d'accouchement prévue</h4>
                        <p class="text-center display-4">${data.dueDate}</p>
                    </div>
                </div>
                
                <hr>
                
                <h4>Recommandations pour ce terme</h4>
                <div class="row">
                    <div class="col">
                        <h5><i class="fas fa-stethoscope medical-icon"></i>Examens</h5>
                        <ul class="list-group">
                            ${data.recommendations.examinations.map(exam => 
                                `<li class="list-group-item">${exam}</li>`
                            ).join('')}
                        </ul>
                    </div>
                    <div class="col">
                        <h5><i class="fas fa-flask medical-icon"></i>Analyses</h5>
                        <ul class="list-group">
                            ${data.recommendations.tests.map(test => 
                                `<li class="list-group-item">${test}</li>`
                            ).join('')}
                        </ul>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h5><i class="fas fa-calendar-check medical-icon"></i>Suivi</h5>
                    <ul class="list-group">
                        ${data.recommendations.followUp.map(followUp => 
                            `<li class="list-group-item">${followUp}</li>`
                        ).join('')}
                    </ul>
                </div>
                
                ${data.recommendations.warning ? 
                    `<div class="alert alert-warning mt-4">
                        <i class="fas fa-exclamation-triangle"></i> ${data.recommendations.warning}
                    </div>` : ''
                }
            </div>
            <div class="card-footer text-center">
                <button type="button" class="btn btn-primary" onclick="window.print()">
                    <i class="fas fa-print"></i> Imprimer
                </button>
                <button type="button" class="btn btn-outline-primary" onclick="saveToPatientRecord()">
                    <i class="fas fa-save"></i> Enregistrer
                </button>
            </div>
        </div>
    `;
    
    resultContainer.innerHTML = html;
}

/**
 * Display error message
 */
function showError(message) {
    const resultContainer = document.getElementById('resultContainer');
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> ${message}
            </div>
        `;
    }
}

/**
 * Save calculation to patient record (placeholder function)
 */
function saveToPatientRecord() {
    // This function would be implemented when patient selection is available
    alert('Cette fonctionnalité sera disponible dans une prochaine mise à jour.');
}
