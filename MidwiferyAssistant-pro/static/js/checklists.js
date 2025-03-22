/**
 * Adaptive Checklists for Pregnancy Follow-up
 * 
 * This script handles the generation and display of gestational age-specific checklists
 * for pregnancy monitoring.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize weeks slider
    const weeksSlider = document.getElementById('weeksSlider');
    const weeksValue = document.getElementById('weeksValue');
    
    if (weeksSlider && weeksValue) {
        // Set initial value
        weeksValue.textContent = weeksSlider.value;
        
        // Update the checklist on slider change
        weeksSlider.addEventListener('input', function() {
            weeksValue.textContent = this.value;
            updateChecklist(parseInt(this.value, 10));
        });
        
        // Initialize checklist with default value
        updateChecklist(parseInt(weeksSlider.value, 10));
    }
    
    // Initialize trimester tabs if they exist
    const trimesterTabs = document.querySelectorAll('.trimester-tab');
    if (trimesterTabs.length > 0) {
        trimesterTabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all tabs
                trimesterTabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Get the weeks value from the data attribute
                const weeks = parseInt(this.dataset.weeks, 10);
                
                // Update the slider value
                if (weeksSlider && weeksValue) {
                    weeksSlider.value = weeks;
                    weeksValue.textContent = weeks;
                }
                
                // Update the checklist
                updateChecklist(weeks);
            });
        });
    }
});

/**
 * Updates the checklist based on the selected gestational age
 * 
 * @param {number} weeks - Gestational age in weeks
 */
function updateChecklist(weeks) {
    const checklistContainer = document.getElementById('checklistContainer');
    if (!checklistContainer) return;
    
    // Show loading state
    checklistContainer.innerHTML = '<div class="text-center"><div class="loading-spinner"></div><p>Chargement des recommandations...</p></div>';
    
    // Get checklist data based on gestational age
    const checklistData = getChecklistData(weeks);
    
    // Build HTML for checklist
    let html = '';
    
    // Add trimester indicator
    let trimester = '';
    if (weeks < 14) {
        trimester = 'Premier trimestre';
    } else if (weeks < 28) {
        trimester = 'Deuxième trimestre';
    } else {
        trimester = 'Troisième trimestre';
    }
    
    html += `
        <div class="alert alert-info">
            <strong>${trimester}</strong> - ${weeks} semaines d'aménorrhée
        </div>
    `;
    
    // Add clinical examinations section
    html += `
        <div class="card mb-4">
            <div class="card-header">
                <h3 class="card-title"><i class="fas fa-stethoscope medical-icon"></i>Examens cliniques</h3>
            </div>
            <div class="card-body">
                <ul class="list-group">
    `;
    
    checklistData.clinical.forEach(item => {
        html += `
            <li class="list-group-item">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="clinical-${item.id}">
                    <label class="form-check-label" for="clinical-${item.id}">
                        ${item.text}
                    </label>
                    ${item.note ? `<small class="text-muted d-block">${item.note}</small>` : ''}
                </div>
            </li>
        `;
    });
    
    html += `
                </ul>
            </div>
        </div>
    `;
    
    // Add laboratory tests section
    html += `
        <div class="card mb-4">
            <div class="card-header">
                <h3 class="card-title"><i class="fas fa-flask medical-icon"></i>Analyses et bilans</h3>
            </div>
            <div class="card-body">
                <ul class="list-group">
    `;
    
    checklistData.laboratory.forEach(item => {
        html += `
            <li class="list-group-item">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="lab-${item.id}">
                    <label class="form-check-label" for="lab-${item.id}">
                        ${item.text}
                    </label>
                    ${item.note ? `<small class="text-muted d-block">${item.note}</small>` : ''}
                </div>
            </li>
        `;
    });
    
    html += `
                </ul>
            </div>
        </div>
    `;
    
    // Add imaging section
    html += `
        <div class="card mb-4">
            <div class="card-header">
                <h3 class="card-title"><i class="fas fa-ultrasound medical-icon"></i>Imagerie</h3>
            </div>
            <div class="card-body">
                <ul class="list-group">
    `;
    
    checklistData.imaging.forEach(item => {
        html += `
            <li class="list-group-item">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="img-${item.id}">
                    <label class="form-check-label" for="img-${item.id}">
                        ${item.text}
                    </label>
                    ${item.note ? `<small class="text-muted d-block">${item.note}</small>` : ''}
                </div>
            </li>
        `;
    });
    
    html += `
                </ul>
            </div>
        </div>
    `;
    
    // Add education and counseling section
    html += `
        <div class="card mb-4">
            <div class="card-header">
                <h3 class="card-title"><i class="fas fa-comments medical-icon"></i>Éducation et conseils</h3>
            </div>
            <div class="card-body">
                <ul class="list-group">
    `;
    
    checklistData.education.forEach(item => {
        html += `
            <li class="list-group-item">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="edu-${item.id}">
                    <label class="form-check-label" for="edu-${item.id}">
                        ${item.text}
                    </label>
                    ${item.note ? `<small class="text-muted d-block">${item.note}</small>` : ''}
                </div>
            </li>
        `;
    });
    
    html += `
                </ul>
            </div>
        </div>
    `;
    
    // Add special considerations if any
    if (checklistData.specialConsiderations && checklistData.specialConsiderations.length > 0) {
        html += `
            <div class="card mb-4">
                <div class="card-header bg-warning text-white">
                    <h3 class="card-title"><i class="fas fa-exclamation-triangle"></i> Points d'attention particuliers</h3>
                </div>
                <div class="card-body">
                    <ul class="list-group">
        `;
        
        checklistData.specialConsiderations.forEach(item => {
            html += `
                <li class="list-group-item list-group-item-warning">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="special-${item.id}">
                        <label class="form-check-label" for="special-${item.id}">
                            <strong>${item.text}</strong>
                        </label>
                        ${item.note ? `<small class="d-block">${item.note}</small>` : ''}
                    </div>
                </li>
            `;
        });
        
        html += `
                    </ul>
                </div>
            </div>
        `;
    }
    
    // Add print and save buttons
    html += `
        <div class="text-center mt-4 mb-4">
            <button type="button" class="btn btn-primary mr-2" onclick="window.print()">
                <i class="fas fa-print"></i> Imprimer
            </button>
            <button type="button" class="btn btn-outline-primary" onclick="saveChecklist()">
                <i class="fas fa-save"></i> Enregistrer
            </button>
        </div>
    `;
    
    // Update the container
    checklistContainer.innerHTML = html;
}

/**
 * Get checklist data based on gestational age
 * 
 * @param {number} weeks - Gestational age in weeks
 * @returns {Object} Checklist data
 */
function getChecklistData(weeks) {
    // First trimester (up to 13+6 weeks)
    if (weeks < 14) {
        return {
            clinical: [
                { id: 'c1-1', text: 'Examen clinique général' },
                { id: 'c1-2', text: 'Prise des constantes (TA, pouls, poids, taille)', note: 'Calcul IMC' },
                { id: 'c1-3', text: 'Examen gynécologique', note: 'Frottis si > 3 ans (avant 14 SA)' },
                { id: 'c1-4', text: 'Recherche d\'antécédents personnels et familiaux' },
                { id: 'c1-5', text: 'Évaluation du risque de prééclampsie' }
            ],
            laboratory: [
                { id: 'l1-1', text: 'Groupe sanguin et Rhésus (2 déterminations)', note: 'RAI si Rhésus négatif' },
                { id: 'l1-2', text: 'Sérologie toxoplasmose', note: 'À répéter chaque mois si négative' },
                { id: 'l1-3', text: 'Sérologie rubéole (si statut inconnu)' },
                { id: 'l1-4', text: 'Glycémie à jeun' },
                { id: 'l1-5', text: 'Sérologies VIH, VHB, VHC, Syphilis' },
                { id: 'l1-6', text: 'Hémogramme, ferritinémie', note: 'Dépistage anémie' },
                { id: 'l1-7', text: 'ECBU' },
                { id: 'l1-8', text: 'Dépistage trisomie 21', note: 'Marqueurs sériques + clarté nucale (11-13+6 SA)' }
            ],
            imaging: [
                { id: 'i1-1', text: 'Échographie T1 (11-13+6 SA)', note: 'Datation, vitalité, clarté nucale' }
            ],
            education: [
                { id: 'e1-1', text: 'Prescription acide folique (0,4 mg/j)', note: 'Jusqu\'à 12 SA' },
                { id: 'e1-2', text: 'Conseils d\'hygiène alimentaire', note: 'Prévention toxoplasmose, listériose' },
                { id: 'e1-3', text: 'Information sur les substances tératogènes', note: 'Alcool, tabac, médicaments' },
                { id: 'e1-4', text: 'Entretien prénatal précoce' },
                { id: 'e1-5', text: 'Information sur le dépistage T21' }
            ]
        };
    }
    // Second trimester (14 to 27+6 weeks)
    else if (weeks < 28) {
        return {
            clinical: [
                { id: 'c2-1', text: 'Examen clinique et obstétrical' },
                { id: 'c2-2', text: 'Prise des constantes (TA, pouls, poids)' },
                { id: 'c2-3', text: 'Recherche d\'œdèmes' },
                { id: 'c2-4', text: 'Recherche protéinurie (bandelette)' },
                { id: 'c2-5', text: 'Mesure hauteur utérine (à partir de 22 SA)' },
                { id: 'c2-6', text: 'Auscultation des bruits du cœur fœtal' }
            ],
            laboratory: [
                { id: 'l2-1', text: 'Sérologie toxoplasmose mensuelle (si négative)' },
                { id: 'l2-2', text: 'RAI si Rhésus négatif (à 28 SA)' },
                { id: 'l2-3', text: 'Dépistage diabète gestationnel (24-28 SA)', note: 'Test O\'Sullivan ou HGPO 75g' },
                { id: 'l2-4', text: 'NFS, ferritinémie' }
            ],
            imaging: [
                { id: 'i2-1', text: 'Échographie T2 (22-24 SA)', note: 'Morphologie, croissance, placenta' }
            ],
            education: [
                { id: 'e2-1', text: 'Conseils d\'hygiène de vie', note: 'Alimentation, activité physique adaptée' },
                { id: 'e2-2', text: 'Préparation à la naissance et à la parentalité' },
                { id: 'e2-3', text: 'Information sur les signes d\'alerte', note: 'Contractions, saignements, etc.' },
                { id: 'e2-4', text: 'Projet de naissance' }
            ]
        };
    }
    // Third trimester (28 weeks and beyond)
    else {
        let specialConsiderations = [];
        
        // Special considerations near term
        if (weeks >= 37) {
            specialConsiderations = [
                { id: 's3-1', text: 'Grossesse à terme - Surveillance rapprochée', note: 'Consultation en urgence si rupture des membranes, contractions régulières, diminution des mouvements actifs fœtaux' },
                { id: 's3-2', text: 'Vérifier présentation fœtale', note: 'Si présentation par le siège: informer des modalités d\'accouchement' }
            ];
        }
        
        return {
            clinical: [
                { id: 'c3-1', text: 'Examen clinique et obstétrical complet' },
                { id: 'c3-2', text: 'Prise des constantes (TA, pouls, poids)' },
                { id: 'c3-3', text: 'Mesure hauteur utérine' },
                { id: 'c3-4', text: 'Recherche protéinurie (bandelette)' },
                { id: 'c3-5', text: 'Recherche d\'œdèmes' },
                { id: 'c3-6', text: 'Auscultation des bruits du cœur fœtal' },
                { id: 'c3-7', text: 'Évaluation du col utérin (à partir de 35 SA)' },
                { id: 'c3-8', text: 'Vérification de la présentation fœtale' },
                { id: 'c3-9', text: 'Surveillance mouvements actifs fœtaux' }
            ],
            laboratory: [
                { id: 'l3-1', text: 'Sérologie toxoplasmose mensuelle (si négative)' },
                { id: 'l3-2', text: 'RAI si Rhésus négatif ou transfusion/injection/saignement' },
                { id: 'l3-3', text: 'Bilan pré-anesthésique (après 36 SA)' },
                { id: 'l3-4', text: 'Prélèvement vaginal pour recherche Streptocoque B (34-38 SA)' },
                { id: 'l3-5', text: 'NFS, ferritinémie' }
            ],
            imaging: [
                { id: 'i3-1', text: 'Échographie T3 (32-34 SA)', note: 'Croissance, position placenta, quantité liquide' }
            ],
            education: [
                { id: 'e3-1', text: 'Préparation à l\'accouchement' },
                { id: 'e3-2', text: 'Information allaitement maternel / artificiel' },
                { id: 'e3-3', text: 'Signes d\'entrée en travail' },
                { id: 'e3-4', text: 'Motifs de consultation en urgence' },
                { id: 'e3-5', text: 'Organisation du retour à domicile' }
            ],
            specialConsiderations: specialConsiderations
        };
    }
}

/**
 * Save the current checklist (placeholder function)
 */
function saveChecklist() {
    alert('Cette fonctionnalité sera disponible dans une prochaine mise à jour.');
}
