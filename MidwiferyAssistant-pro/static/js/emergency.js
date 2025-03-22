/**
 * Emergency Obstetrical Protocols
 * 
 * This script handles the display and interactive guidance for
 * obstetrical emergency protocols.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load emergency protocols
    loadEmergencyProtocols();
    
    // Setup search functionality
    const searchInput = document.getElementById('protocol-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterProtocols(this.value);
        });
    }
    
    // Initialize protocol tabs
    initProtocolTabs();
});

/**
 * Load emergency protocols from the server
 */
function loadEmergencyProtocols() {
    const protocolsContainer = document.getElementById('protocols-container');
    if (!protocolsContainer) return;
    
    // In a production app, we would fetch this from the server
    // Here we're using the data from the utils.py file
    const emergencyProtocols = {
        'hemorrhage': {
            'title': 'Hémorragie du Post-Partum',
            'definition': 'Saignement > 500ml après accouchement',
            'signs': [
                'Saignement abondant',
                'Hypotension',
                'Tachycardie',
                'Pâleur'
            ],
            'actions': [
                '1. Massage utérin bimanuel',
                '2. Voie veineuse 14-16G',
                '3. Ocytocine 5-10 UI IVL puis 20-40 UI/500ml',
                '4. Remplissage vasculaire',
                '5. Sondage vésical',
                '6. Appel équipe obstétricale + anesthésiste'
            ],
            'severity_levels': [
                {'volume': '< 1000ml', 'action': 'Surveillance, ocytocine'},
                {'volume': '1000-1500ml', 'action': 'Sulprostone, examiner sous valves'},
                {'volume': '> 1500ml', 'action': 'Transfusion, chirurgie'}
            ]
        },
        'preeclampsia': {
            'title': 'Pré-éclampsie Sévère',
            'definition': 'HTA > 160/110 + protéinurie',
            'signs': [
                'Céphalées intenses',
                'Troubles visuels',
                'Douleur épigastrique',
                'Hyperréflexie',
                'Oligurie'
            ],
            'actions': [
                '1. Position latérale gauche',
                '2. Voie veineuse',
                '3. Nicardipine (Loxen) IVSE',
                '4. Sulfate de magnésium (prévention éclampsie)',
                '5. Bilan biologique complet',
                '6. Évaluation fœtale',
                '7. Transfert en maternité niveau 3'
            ],
            'severity_levels': [
                {'symptoms': 'HTA + protéinurie', 'action': 'Hospitalisation, surveillance'},
                {'symptoms': '+ Signes fonctionnels', 'action': 'Traitement anti-HTA, sulfate Mg'},
                {'symptoms': '+ Éclampsie/HELLP', 'action': 'Extraction fœtale urgente'}
            ]
        },
        'shoulder_dystocia': {
            'title': 'Dystocie des Épaules',
            'definition': 'Rétention des épaules après sortie de la tête',
            'signs': [
                'Rétraction de la tête contre le périnée (signe de la tortue)',
                'Échec de la rotation externe',
                'Traction inefficace sur la tête'
            ],
            'actions': [
                '1. Appel à l\'aide',
                '2. Manœuvre de McRoberts (hyperfléxion des cuisses)',
                '3. Pression sus-pubienne',
                '4. Manœuvre de Wood',
                '5. Manœuvre de Jacquemier (extraction de l\'épaule postérieure)',
                '6. Épisiotomie large si nécessaire'
            ],
            'severity_levels': [
                {'time': '< 5 min', 'action': 'McRoberts + pression sus-pubienne'},
                {'time': '> 5 min', 'action': 'Manœuvres obstétricales internes'},
                {'time': '> 10 min', 'action': 'Risque hypoxie/fracture, manœuvres de dernier recours'}
            ]
        },
        'cord_prolapse': {
            'title': 'Procidence du Cordon',
            'definition': 'Passage du cordon en avant de la présentation',
            'signs': [
                'Visualisation ou palpation du cordon',
                'Anomalies du RCF (bradycardie brutale)',
                'Rupture des membranes récente'
            ],
            'actions': [
                '1. Position genupectorale ou Trendelenburg',
                '2. Repousse manuelle de la présentation',
                '3. Remplissage vésical (300-500ml)',
                '4. Tocolvse d\'urgence (β-mimétiques)',
                '5. Extraction immédiate (césarienne ou voie basse si dilatation complète)'
            ],
            'severity_levels': [
                {'rcf': 'Normal', 'action': 'Césarienne urgente, repousse manuelle'},
                {'rcf': 'Bradycardie < 100', 'action': 'Césarienne extrême urgence'},
                {'rcf': 'Absence d\'activité', 'action': 'Extraction immédiate quel que soit le moyen'}
            ]
        }
    };
    
    // Generate HTML for protocols
    displayProtocols(emergencyProtocols);
}

/**
 * Display emergency protocols
 */
function displayProtocols(protocols) {
    const protocolsContainer = document.getElementById('protocols-container');
    if (!protocolsContainer) return;
    
    // Generate tabs for protocols
    let tabsHtml = '<ul class="nav nav-tabs" id="protocol-tabs" role="tablist">';
    let contentHtml = '<div class="tab-content" id="protocol-tabs-content">';
    
    let firstTab = true;
    for (const [key, protocol] of Object.entries(protocols)) {
        const tabId = `protocol-${key}`;
        
        // Create tab
        tabsHtml += `
            <li class="nav-item" role="presentation">
                <a class="nav-link ${firstTab ? 'active' : ''}" 
                   id="${tabId}-tab" 
                   data-toggle="tab" 
                   href="#${tabId}" 
                   role="tab" 
                   aria-controls="${tabId}" 
                   aria-selected="${firstTab ? 'true' : 'false'}">
                    ${protocol.title}
                </a>
            </li>
        `;
        
        // Create tab content
        contentHtml += `
            <div class="tab-pane fade ${firstTab ? 'show active' : ''}" 
                 id="${tabId}" 
                 role="tabpanel" 
                 aria-labelledby="${tabId}-tab">
                <div class="protocol-section">
                    <h3 class="protocol-title">${protocol.title}</h3>
                    <p class="protocol-definition">${protocol.definition}</p>
                    
                    <div class="row mt-4">
                        <div class="col-md-6">
                            <h4><i class="fas fa-exclamation-circle text-warning"></i> Signes cliniques</h4>
                            <ul class="protocol-list">
                                ${protocol.signs.map(sign => `<li>${sign}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h4><i class="fas fa-first-aid text-danger"></i> Actions immédiates</h4>
                            <ul class="protocol-list">
                                ${protocol.actions.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <h4><i class="fas fa-chart-line"></i> Niveaux de gravité</h4>
                        <table class="table severity-table">
                            <thead>
                                <tr>
                                    <th>${getSeverityLabel(key)}</th>
                                    <th>Prise en charge</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${protocol.severity_levels.map((level, index) => `
                                    <tr class="severity-level-row ${getSeverityClass(index)}">
                                        <td>${getSeverityKey(key, level)}</td>
                                        <td>${level.action}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="alert alert-info mt-4">
                        <i class="fas fa-info-circle"></i> Document ces manoeuvres et actions dans le dossier médical.
                    </div>
                </div>
            </div>
        `;
        
        firstTab = false;
    }
    
    tabsHtml += '</ul>';
    contentHtml += '</div>';
    
    // Display protocols
    protocolsContainer.innerHTML = tabsHtml + contentHtml;
}

/**
 * Get appropriate severity label based on protocol type
 */
function getSeverityLabel(protocolKey) {
    switch (protocolKey) {
        case 'hemorrhage':
            return 'Volume de saignement';
        case 'preeclampsia':
            return 'Symptômes';
        case 'shoulder_dystocia':
            return 'Temps écoulé';
        case 'cord_prolapse':
            return 'RCF';
        default:
            return 'Sévérité';
    }
}

/**
 * Get severity key based on protocol type and level
 */
function getSeverityKey(protocolKey, level) {
    switch (protocolKey) {
        case 'hemorrhage':
            return level.volume;
        case 'preeclampsia':
            return level.symptoms;
        case 'shoulder_dystocia':
            return level.time;
        case 'cord_prolapse':
            return level.rcf;
        default:
            return '';
    }
}

/**
 * Get CSS class for severity level
 */
function getSeverityClass(index) {
    switch (index) {
        case 0:
            return 'severity-level-mild';
        case 1:
            return 'severity-level-moderate';
        case 2:
            return 'severity-level-severe';
        default:
            return '';
    }
}

/**
 * Initialize protocol tabs
 */
function initProtocolTabs() {
    const tabLinks = document.querySelectorAll('#protocol-tabs .nav-link');
    
    if (tabLinks.length > 0) {
        tabLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Hide all tab contents
                document.querySelectorAll('#protocol-tabs-content .tab-pane').forEach(pane => {
                    pane.classList.remove('show', 'active');
                });
                
                // Deactivate all tabs
                tabLinks.forEach(tab => {
                    tab.classList.remove('active');
                    tab.setAttribute('aria-selected', 'false');
                });
                
                // Activate clicked tab
                this.classList.add('active');
                this.setAttribute('aria-selected', 'true');
                
                // Show corresponding content
                const targetId = this.getAttribute('href').substring(1);
                const targetPane = document.getElementById(targetId);
                if (targetPane) {
                    targetPane.classList.add('show', 'active');
                }
            });
        });
    }
}

/**
 * Filter protocols based on search query
 */
function filterProtocols(query) {
    if (!query) {
        // Show all protocols if query is empty
        document.querySelectorAll('#protocol-tabs .nav-link').forEach(tab => {
            tab.style.display = '';
        });
        
        // Select first tab if none is selected
        const activeTab = document.querySelector('#protocol-tabs .nav-link.active');
        if (!activeTab) {
            const firstTab = document.querySelector('#protocol-tabs .nav-link');
            if (firstTab) {
                firstTab.click();
            }
        }
        
        return;
    }
    
    // Convert query to lowercase for case-insensitive search
    query = query.toLowerCase();
    
    // Filter tabs
    document.querySelectorAll('#protocol-tabs .nav-link').forEach(tab => {
        const tabText = tab.textContent.toLowerCase();
        const tabContent = document.querySelector(tab.getAttribute('href')).textContent.toLowerCase();
        
        if (tabText.includes(query) || tabContent.includes(query)) {
            tab.style.display = '';
            
            // Activate this tab if it's the first match and no tab is currently active
            const activeTab = document.querySelector('#protocol-tabs .nav-link.active');
            if (!activeTab || activeTab.style.display === 'none') {
                tab.click();
            }
        } else {
            tab.style.display = 'none';
        }
    });
}
