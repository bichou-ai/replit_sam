/**
 * Module de Suivi Postnatal
 * 
 * Ce script gère les fonctionnalités du module de suivi postnatal, permettant
 * le suivi complet de la mère et du bébé après l'accouchement, avec gestion des
 * vaccinations, de l'allaitement et des rappels de soins.
 */

// Gestion des événements au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Charger les données initiales
    loadPatients();
    loadBabies();
    loadDeliveries();
    loadReminders();
    initCharts();

    // Gestion des changements d'onglets
    const pillsTab = document.querySelectorAll('.nav-link');
    pillsTab.forEach(pill => {
        pill.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            updateContent(targetId);
        });
    });

    // Gestionnaires d'événements pour les formulaires et autres interactions
    initEventListeners();
    setupFormHandlers();
});

// Fonction pour mettre à jour le contenu selon l'onglet
function updateContent(tabId) {
    switch(tabId) {
        case 'deliveries':
            loadDeliveries();
            break;
        case 'mothers':
            refreshMotherSection();
            break;
        case 'babies':
            refreshBabySection();
            break;
        case 'breastfeeding':
            refreshBreastfeedingSection();
            break;
        case 'vaccinations':
            refreshVaccinationSection();
            break;
        case 'reminders':
            loadReminders();
            break;
    }
}

// Charger la liste des patientes
function loadPatients() {
    fetch('/api/patients')
        .then(response => response.json())
        .then(data => {
            updatePatientSelects(data.patients);
        })
        .catch(error => console.error('Erreur:', error));
}

// Charger la liste des bébés
function loadBabies() {
    fetch('/api/postnatal/babies')
        .then(response => response.json())
        .then(data => {
            updateBabySelects(data.babies);
        })
        .catch(error => console.error('Erreur:', error));
}

// Charger les accouchements
function loadDeliveries() {
    fetch('/api/postnatal/deliveries')
        .then(response => response.json())
        .then(data => {
            updateDeliveriesTable(data.deliveries);
        })
        .catch(error => console.error('Erreur:', error));
}

// Mettre à jour tous les selects de patientes
function updatePatientSelects(patients) {
    const selects = [
        'delivery-patient',
        'mother-checkup-patient',
        'reminder-patient'
    ];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Sélectionnez une patiente...</option>';
            patients.forEach(patient => {
                select.innerHTML += `<option value="${patient.id}">${patient.last_name} ${patient.first_name}</option>`;
            });
        }
    });
}

// Mettre à jour tous les selects de bébés
function updateBabySelects(babies) {
    const selects = [
        'baby-checkup-baby',
        'breastfeeding-baby',
        'vaccination-baby',
        'reminder-baby'
    ];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Sélectionnez un bébé...</option>';
            babies.forEach(baby => {
                select.innerHTML += `<option value="${baby.id}">${baby.first_name || 'Bébé de ' + baby.mother_name}</option>`;
            });
        }
    });
}


//Fonction pour mettre à jour le tableau des accouchements
function updateDeliveriesTable(deliveries){
    const deliveriesTable = document.getElementById('deliveries-table');
    if (!deliveriesTable) return;
    const tbody = deliveriesTable.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!deliveries || deliveries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Aucun accouchement enregistré</td></tr>';
        return;
    }
    deliveries.forEach(delivery => {
        const deliveryDate = new Date(delivery.delivery_date).toLocaleDateString('fr-FR');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${deliveryDate}</td>
            <td>${delivery.patient_name}</td>
            <td>${translateDeliveryType(delivery.delivery_type)}</td>
            <td>${delivery.delivery_location}</td>
            <td>${delivery.complications || '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-delivery-details" data-delivery-id="${delivery.id}">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    document.querySelectorAll('.view-delivery-details').forEach(button => {
        button.addEventListener('click', function() {
            const deliveryId = this.getAttribute('data-delivery-id');
            viewDeliveryDetails(deliveryId);
        });
    });
}


// Configuration des gestionnaires de formulaires
function setupFormHandlers() {
    // Formulaire d'accouchement
    const saveDeliveryBtn = document.getElementById('save-delivery-btn');
    if (saveDeliveryBtn) {
        saveDeliveryBtn.addEventListener('click', handleDeliverySubmit);
    }

    // Formulaire d'examen mère
    const saveMotherCheckupBtn = document.getElementById('save-mother-checkup-btn');
    if (saveMotherCheckupBtn) {
        saveMotherCheckupBtn.addEventListener('click', handleMotherCheckupSubmit);
    }

    // Formulaire d'examen bébé
    const saveBabyCheckupBtn = document.getElementById('save-baby-checkup-btn');
    if (saveBabyCheckupBtn) {
        saveBabyCheckupBtn.addEventListener('click', handleBabyCheckupSubmit);
    }
    // Formulaire d'ajout d'allaitement
    const saveBreastfeedingBtn = document.getElementById('save-breastfeeding-btn');
    if (saveBreastfeedingBtn) {
        saveBreastfeedingBtn.addEventListener('click', submitBreastfeedingForm);
    }
    
    // Formulaire d'ajout de vaccination
    const saveVaccinationBtn = document.getElementById('save-vaccination-btn');
    if (saveVaccinationBtn) {
        saveVaccinationBtn.addEventListener('click', submitVaccinationForm);
    }
    
    // Formulaire d'ajout de rappel
    const saveReminderBtn = document.getElementById('save-reminder-btn');
    if (saveReminderBtn) {
        saveReminderBtn.addEventListener('click', submitReminderForm);
    }

    // Gestion des vaccins personnalisés
    const vaccinationName = document.getElementById('vaccination-name');
    if (vaccinationName) {
        vaccinationName.addEventListener('change', function() {
            const otherVaccineContainer = document.getElementById('other-vaccine-container');
            if (otherVaccineContainer) {
                otherVaccineContainer.classList.toggle('d-none', this.value !== 'other');
            }
        });
    }
    
    // Gestion des types de rappels
    const reminderType = document.getElementById('reminder-type');
    if (reminderType) {
        reminderType.addEventListener('change', function() {
            const patientContainer = document.getElementById('reminder-patient-container');
            const babyContainer = document.getElementById('reminder-baby-container');
            if (patientContainer && babyContainer) {
                patientContainer.classList.toggle('d-none', this.value !== 'mother' && this.value !== 'both');
                babyContainer.classList.toggle('d-none', this.value !== 'baby' && this.value !== 'both');
            }
        });
    }
    
    // Filtres pour les rappels
    const reminderFilters = [
        document.getElementById('reminder-type-filter'),
        document.getElementById('reminder-priority-filter'),
        document.getElementById('reminder-status-filter')
    ];
    reminderFilters.forEach(filter => {
        if (filter) {
            filter.addEventListener('change', filterReminders);
        }
    });
    // Bouton de réinitialisation des filtres
    const resetReminderFilters = document.getElementById('reset-reminder-filters');
    if (resetReminderFilters) {
        resetReminderFilters.addEventListener('click', function() {
            reminderFilters.forEach(filter => {
                if (filter) filter.value = 'all';
            });
            filterReminders();
        });
    }
    // Recherche dans les protocoles
    const protocolSearch = document.getElementById('protocol-search');
    if (protocolSearch) {
        protocolSearch.addEventListener('input', function() {
            filterProtocols(this.value);
        });
    }
    // Afficher les détails de réanimation si coché
    const resuscitationCheckbox = document.getElementById('baby-resuscitation');
    if (resuscitationCheckbox) {
        resuscitationCheckbox.addEventListener('change', function() {
            const detailsContainer = document.getElementById('resuscitation-details-container');
            if (detailsContainer) {
                detailsContainer.classList.toggle('d-none', !this.checked);
            }
        });
    }
    // Sélecteur de mère pour les suivis post-partum
    const motherSelect = document.getElementById('mother-select');
    if (motherSelect) {
        motherSelect.addEventListener('change', function() {
            if (this.value) {
                loadMotherCheckups(this.value);
            } else {
                document.getElementById('mother-checkup-history').innerHTML = 
                    '<div class="alert alert-info">Veuillez sélectionner une patiente pour voir son historique de suivi.</div>';
                document.getElementById('mother-recovery-progress').innerHTML = 
                    '<p class="text-muted">Sélectionnez une patiente pour voir son progrès de récupération.</p>';
            }
        });
    }
    // Sélecteur de bébé pour les suivis
    const babySelect = document.getElementById('baby-select');
    if (babySelect) {
        babySelect.addEventListener('change', function() {
            if (this.value) {
                loadBabyInfo(this.value);
            } else {
                document.getElementById('baby-info').innerHTML = 
                    '<div class="alert alert-info">Veuillez sélectionner un bébé pour voir ses informations.</div>';
            }
        });
    }
    // Autres sélecteurs similaires pour l'allaitement et les vaccinations
    const breastfeedingBabySelect = document.getElementById('breastfeeding-baby-select');
    if (breastfeedingBabySelect) {
        breastfeedingBabySelect.addEventListener('change', function() {
            if (this.value) {
                loadBreastfeedingRecords(this.value);
            } else {
                document.getElementById('breastfeeding-history').innerHTML = 
                    '<div class="alert alert-info">Veuillez sélectionner un bébé pour voir son historique d\'allaitement.</div>';
            }
        });
    }
    const vaccinationBabySelect = document.getElementById('vaccination-baby-select');
    if (vaccinationBabySelect) {
        vaccinationBabySelect.addEventListener('change', function() {
            if (this.value) {
                loadVaccinationRecords(this.value);
            } else {
                document.getElementById('vaccination-history').innerHTML = 
                    '<div class="alert alert-info">Veuillez sélectionner un bébé pour voir son historique de vaccination.</div>';
            }
        });
    }
}

//Fonction pour rafraichir la section mère
function refreshMotherSection(){
    const motherSelect = document.getElementById('mother-select');
    if (motherSelect && motherSelect.value) {
        loadMotherCheckups(motherSelect.value);
    }
}

//Fonction pour rafraichir la section bébé
function refreshBabySection(){
    const babySelect = document.getElementById('baby-select');
    if (babySelect && babySelect.value) {
        loadBabyInfo(babySelect.value);
    }
}

//Fonction pour rafraichir la section allaitement
function refreshBreastfeedingSection(){
    const breastfeedingBabySelect = document.getElementById('breastfeeding-baby-select');
    if (breastfeedingBabySelect && breastfeedingBabySelect.value) {
        loadBreastfeedingRecords(breastfeedingBabySelect.value);
    }
}

//Fonction pour rafraichir la section vaccination
function refreshVaccinationSection(){
    const vaccinationBabySelect = document.getElementById('vaccination-baby-select');
    if (vaccinationBabySelect && vaccinationBabySelect.value) {
        loadVaccinationRecords(vaccinationBabySelect.value);
    }
}

// Fonction pour afficher les erreurs
function showError(message) {
    // Implémenter l'affichage des erreurs selon votre design
    console.error(message);
    alert(message);
}

// Fonction pour afficher les succès
function showSuccess(message) {
    // Implémenter l'affichage des succès selon votre design
    console.log(message);
    alert(message);
}

/**
 * Initialise le module de suivi postnatal
 */
function initPostnatalModule() {
    // Initialiser les graphiques
    initCharts();
    // Initialiser les gestionnaires d'événements
    initEventListeners();
}

/**
 * Initialise les graphiques utilisés dans le module
 */
function initCharts() {
    // Initialiser le graphique des signes vitaux de la mère (vide pour l'instant)
    initMotherVitalsChart();
    // Initialiser le graphique de croissance du bébé (vide pour l'instant)
    initBabyGrowthChart();
    // Initialiser le graphique des signes vitaux du bébé (vide pour l'instant)
    initBabyVitalsChart();
    // Initialiser le graphique d'allaitement (vide pour l'instant)
    initBreastfeedingChart();
}

/**
 * Initialise les gestionnaires d'événements pour les interactions utilisateur
 */
function initEventListeners() {
    // Gestion des sélecteurs
    initSelectorListeners();
    // Gestion des formulaires
    initFormListeners();
    // Gestion des recherches et filtres
    initFilterListeners();
    // Gestion des détails conditionnels (comme les détails de réanimation)
    initConditionalFields();
}

/**
 * Initialise les écouteurs d'événements pour les sélecteurs
 */
function initSelectorListeners() {
    // Sélecteur de mère pour les suivis post-partum
    const motherSelect = document.getElementById('mother-select');
    if (motherSelect) {
        motherSelect.addEventListener('change', function() {
            if (this.value) {
                loadMotherCheckups(this.value);
            } else {
                document.getElementById('mother-checkup-history').innerHTML = 
                    '<div class="alert alert-info">Veuillez sélectionner une patiente pour voir son historique de suivi.</div>';
                document.getElementById('mother-recovery-progress').innerHTML = 
                    '<p class="text-muted">Sélectionnez une patiente pour voir son progrès de récupération.</p>';
            }
        });
    }
    
    // Sélecteur de bébé pour les suivis
    const babySelect = document.getElementById('baby-select');
    if (babySelect) {
        babySelect.addEventListener('change', function() {
            if (this.value) {
                loadBabyInfo(this.value);
            } else {
                document.getElementById('baby-info').innerHTML = 
                    '<div class="alert alert-info">Veuillez sélectionner un bébé pour voir ses informations.</div>';
            }
        });
    }
    
    // Autres sélecteurs similaires pour l'allaitement et les vaccinations
    const breastfeedingBabySelect = document.getElementById('breastfeeding-baby-select');
    if (breastfeedingBabySelect) {
        breastfeedingBabySelect.addEventListener('change', function() {
            if (this.value) {
                loadBreastfeedingRecords(this.value);
            } else {
                document.getElementById('breastfeeding-history').innerHTML = 
                    '<div class="alert alert-info">Veuillez sélectionner un bébé pour voir son historique d\'allaitement.</div>';
            }
        });
    }
    
    const vaccinationBabySelect = document.getElementById('vaccination-baby-select');
    if (vaccinationBabySelect) {
        vaccinationBabySelect.addEventListener('change', function() {
            if (this.value) {
                loadVaccinationRecords(this.value);
            } else {
                document.getElementById('vaccination-history').innerHTML = 
                    '<div class="alert alert-info">Veuillez sélectionner un bébé pour voir son historique de vaccination.</div>';
            }
        });
    }
}

/**
 * Initialise les écouteurs d'événements pour les formulaires
 */
function initFormListeners() {
    // Formulaire d'ajout d'accouchement
    const saveDeliveryBtn = document.getElementById('save-delivery-btn');
    if (saveDeliveryBtn) {
        saveDeliveryBtn.addEventListener('click', function() {
            submitDeliveryForm();
        });
    }
    
    // Formulaire d'ajout d'examen mère
    const saveMotherCheckupBtn = document.getElementById('save-mother-checkup-btn');
    if (saveMotherCheckupBtn) {
        saveMotherCheckupBtn.addEventListener('click', function() {
            submitMotherCheckupForm();
        });
    }
    
    // Formulaire d'ajout d'examen bébé
    const saveBabyCheckupBtn = document.getElementById('save-baby-checkup-btn');
    if (saveBabyCheckupBtn) {
        saveBabyCheckupBtn.addEventListener('click', function() {
            submitBabyCheckupForm();
        });
    }
    
    // Formulaire d'ajout d'allaitement
    const saveBreastfeedingBtn = document.getElementById('save-breastfeeding-btn');
    if (saveBreastfeedingBtn) {
        saveBreastfeedingBtn.addEventListener('click', function() {
            submitBreastfeedingForm();
        });
    }
    
    // Formulaire d'ajout de vaccination
    const saveVaccinationBtn = document.getElementById('save-vaccination-btn');
    if (saveVaccinationBtn) {
        saveVaccinationBtn.addEventListener('click', function() {
            submitVaccinationForm();
        });
    }
    
    // Formulaire d'ajout de rappel
    const saveReminderBtn = document.getElementById('save-reminder-btn');
    if (saveReminderBtn) {
        saveReminderBtn.addEventListener('click', function() {
            submitReminderForm();
        });
    }
    
    // Gestion des vaccins personnalisés
    const vaccinationName = document.getElementById('vaccination-name');
    if (vaccinationName) {
        vaccinationName.addEventListener('change', function() {
            const otherVaccineContainer = document.getElementById('other-vaccine-container');
            if (otherVaccineContainer) {
                otherVaccineContainer.classList.toggle('d-none', this.value !== 'other');
            }
        });
    }
    
    // Gestion des types de rappels
    const reminderType = document.getElementById('reminder-type');
    if (reminderType) {
        reminderType.addEventListener('change', function() {
            const patientContainer = document.getElementById('reminder-patient-container');
            const babyContainer = document.getElementById('reminder-baby-container');
            
            if (patientContainer && babyContainer) {
                // Afficher le conteneur patient si le type est 'mother' ou 'both'
                patientContainer.classList.toggle('d-none', this.value !== 'mother' && this.value !== 'both');
                
                // Afficher le conteneur bébé si le type est 'baby' ou 'both'
                babyContainer.classList.toggle('d-none', this.value !== 'baby' && this.value !== 'both');
            }
        });
    }
}

/**
 * Initialise les écouteurs d'événements pour les filtres et recherches
 */
function initFilterListeners() {
    // Filtres pour les rappels
    const reminderFilters = [
        document.getElementById('reminder-type-filter'),
        document.getElementById('reminder-priority-filter'),
        document.getElementById('reminder-status-filter')
    ];
    
    reminderFilters.forEach(filter => {
        if (filter) {
            filter.addEventListener('change', function() {
                filterReminders();
            });
        }
    });
    
    // Bouton de réinitialisation des filtres
    const resetReminderFilters = document.getElementById('reset-reminder-filters');
    if (resetReminderFilters) {
        resetReminderFilters.addEventListener('click', function() {
            reminderFilters.forEach(filter => {
                if (filter) filter.value = 'all';
            });
            filterReminders();
        });
    }
    
    // Recherche dans les protocoles
    const protocolSearch = document.getElementById('protocol-search');
    if (protocolSearch) {
        protocolSearch.addEventListener('input', function() {
            filterProtocols(this.value);
        });
    }
}

/**
 * Initialise les champs conditionnels qui apparaissent en fonction d'autres champs
 */
function initConditionalFields() {
    // Afficher les détails de réanimation si coché
    const resuscitationCheckbox = document.getElementById('baby-resuscitation');
    if (resuscitationCheckbox) {
        resuscitationCheckbox.addEventListener('change', function() {
            const detailsContainer = document.getElementById('resuscitation-details-container');
            if (detailsContainer) {
                detailsContainer.classList.toggle('d-none', !this.checked);
            }
        });
    }
}


/**
 * Charge les rappels à venir
 */
function loadReminders() {
    // Simuler le chargement des rappels (à remplacer par un appel API réel)
    setTimeout(() => {
        const upcomingRemindersDiv = document.getElementById('upcoming-reminders');
        if (upcomingRemindersDiv) {
            upcomingRemindersDiv.innerHTML = '<div class="reminder-list">' +
                '<div class="reminder-item">' +
                    '<div class="reminder-date">Aujourd\'hui</div>' +
                    '<div class="reminder-title">Visite postnatale - Mme Dupont</div>' +
                    '<div class="reminder-badge high">Haute</div>' +
                '</div>' +
                '<div class="reminder-item">' +
                    '<div class="reminder-date">Demain</div>' +
                    '<div class="reminder-title">Vaccination BCG - Bébé Martin</div>' +
                    '<div class="reminder-badge normal">Normale</div>' +
                '</div>' +
                '<div class="reminder-item">' +
                    '<div class="reminder-date">24 Mars</div>' +
                    '<div class="reminder-title">Suivi allaitement - Mme Bernard</div>' +
                    '<div class="reminder-badge normal">Normale</div>' +
                '</div>' +
            '</div>';
        }
    }, 1000);
}

/**
 * Initialise le graphique des signes vitaux de la mère
 */
function initMotherVitalsChart() {
    const ctx = document.getElementById('mother-vitals-chart');
    if (!ctx) return;
    
    const data = {
        labels: [],
        datasets: [
            {
                label: 'Tension systolique (mmHg)',
                data: [],
                borderColor: '#DC3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4
            },
            {
                label: 'Tension diastolique (mmHg)',
                data: [],
                borderColor: '#FD7E14',
                backgroundColor: 'rgba(253, 126, 20, 0.1)',
                tension: 0.4
            },
            {
                label: 'Fréquence cardiaque (bpm)',
                data: [],
                borderColor: '#0D6EFD',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                tension: 0.4
            },
            {
                label: 'Température (°C)',
                data: [],
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                tension: 0.4,
                hidden: true
            }
        ]
    };
    
    const options = {
        scales: {
            y: {
                beginAtZero: false,
                suggestedMin: 30,
                suggestedMax: 180
            }
        },
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false
            },
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    usePointStyle: true
                }
            }
        },
        maintainAspectRatio: false
    };
    
    new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}

/**
 * Initialise le graphique de croissance du bébé
 */
function initBabyGrowthChart() {
    const ctx = document.getElementById('baby-growth-chart');
    if (!ctx) return;
    
    const data = {
        labels: [],
        datasets: [
            {
                label: 'Poids (g)',
                data: [],
                borderColor: '#0D6EFD',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                tension: 0.4,
                yAxisID: 'y'
            },
            {
                label: 'Taille (cm)',
                data: [],
                borderColor: '#DC3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4,
                yAxisID: 'y1'
            }
        ]
    };
    
    const options = {
        scales: {
            y: {
                beginAtZero: false,
                position: 'left',
                title: {
                    display: true,
                    text: 'Poids (g)'
                }
            },
            y1: {
                beginAtZero: false,
                position: 'right',
                title: {
                    display: true,
                    text: 'Taille (cm)'
                },
                grid: {
                    drawOnChartArea: false
                }
            }
        },
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false
            },
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    usePointStyle: true
                }
            }
        },
        maintainAspectRatio: false
    };
    
    new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}

/**
 * Initialise le graphique des signes vitaux du bébé
 */
function initBabyVitalsChart() {
    const ctx = document.getElementById('baby-vitals-chart');
    if (!ctx) return;
    
    const data = {
        labels: [],
        datasets: [
            {
                label: 'Fréquence cardiaque (bpm)',
                data: [],
                borderColor: '#0D6EFD',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                tension: 0.4
            },
            {
                label: 'Fréquence respiratoire (resp/min)',
                data: [],
                borderColor: '#FD7E14',
                backgroundColor: 'rgba(253, 126, 20, 0.1)',
                tension: 0.4
            },
            {
                label: 'Température (°C)',
                data: [],
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                tension: 0.4
            }
        ]
    };
    
    const options = {
        scales: {
            y: {
                beginAtZero: false,
                suggestedMin: 30,
                suggestedMax: 180
            }
        },
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false
            },
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    usePointStyle: true
                }
            }
        },
        maintainAspectRatio: false
    };
    
    new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}

/**
 * Initialise le graphique d'allaitement
 */
function initBreastfeedingChart() {
    const ctx = document.getElementById('breastfeeding-chart');
    if (!ctx) return;
    
    const data = {
        labels: [],
        datasets: [
            {
                label: 'Durée (minutes)',
                data: [],
                borderColor: '#0D6EFD',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                type: 'line',
                tension: 0.4
            },
            {
                label: 'Nombre de tétées par jour',
                data: [],
                backgroundColor: 'rgba(25, 135, 84, 0.6)',
                borderColor: '#198754',
                borderWidth: 1,
                type: 'bar'
            }
        ]
    };
    
    const options = {
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Durée / Nombre'
                }
            }
        },
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false
            },
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    usePointStyle: true
                }
            }
        },
        maintainAspectRatio: false
    };
    
    new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options
    });
}

/**
 * Charge les informations d'un bébé et met à jour les graphiques
 */
function loadBabyInfo(babyId) {
    fetch(`/api/postnatal/baby/${babyId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des informations du bébé');
            }
            return response.json();
        })
        .then(data => {
            displayBabyInfo(data);
            updateBabyCharts(data);
        })
        .catch(error => {
            console.error('Erreur:', error);
            showError('Impossible de charger les informations du bébé');
        });
}

/**
 * Charge les suivis post-partum d'une mère
 */
function loadMotherCheckups(motherId) {
    fetch(`/api/postnatal/mother-checkups/${motherId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des suivis post-partum');
            }
            return response.json();
        })
        .then(data => {
            displayMotherCheckups(data);
            updateMotherVitalsChart(data);
        })
        .catch(error => {
            console.error('Erreur:', error);
            showError('Impossible de charger les suivis post-partum');
        });
}

/**
 * Charge les enregistrements d'allaitement pour un bébé
 */
function loadBreastfeedingRecords(babyId) {
    fetch(`/api/postnatal/breastfeeding/${babyId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des records d\'allaitement');
            }
            return response.json();
        })
        .then(data => {
            displayBreastfeedingRecords(data);
            updateBreastfeedingChart(data);
        })
        .catch(error => {
            console.error('Erreur:', error);
            showError('Impossible de charger les records d\'allaitement');
        });
}

/**
 * Charge les records de vaccination pour un bébé
 */
function loadVaccinationRecords(babyId) {
    fetch(`/api/postnatal/vaccinations/${babyId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des vaccinations');
            }
            return response.json();
        })
        .then(data => {
            displayVaccinationRecords(data);
        })
        .catch(error => {
            console.error('Erreur:', error);
            showError('Impossible de charger les vaccinations');
        });
}

/**
 * Filtrer les rappels en fonction des filtres sélectionnés
 */
function filterReminders() {
    const typeFilter = document.getElementById('reminder-type-filter').value;
    const priorityFilter = document.getElementById('reminder-priority-filter').value;
    const statusFilter = document.getElementById('reminder-status-filter').value;
    
    // Requête à l'API avec les filtres
    const queryParams = new URLSearchParams();
    if (typeFilter !== 'all') queryParams.append('type', typeFilter);
    if (priorityFilter !== 'all') queryParams.append('priority', priorityFilter);
    if (statusFilter !== 'all') queryParams.append('status', statusFilter);
    
    fetch(`/api/postnatal/reminders?${queryParams.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du filtrage des rappels');
            }
            return response.json();
        })
        .then(data => {
            displayReminders(data);
        })
        .catch(error => {
            console.error('Erreur:', error);
            showError('Impossible de filtrer les rappels');
        });
}

/**
 * Filtre les protocoles en fonction du texte de recherche
 */
function filterProtocols(searchText) {
    if (!searchText) {
        // Afficher tous les protocoles
        document.querySelectorAll('#resuscitationProtocolsAccordion .accordion-item').forEach(item => {
            item.style.display = '';
        });
        return;
    }
    
    searchText = searchText.toLowerCase();
    
    // Parcourir tous les éléments d'accordéon et cacher ceux qui ne correspondent pas
    document.querySelectorAll('#resuscitationProtocolsAccordion .accordion-item').forEach(item => {
        const headerText = item.querySelector('.accordion-header').textContent.toLowerCase();
        const bodyText = item.querySelector('.accordion-body').textContent.toLowerCase();
        
        if (headerText.includes(searchText) || bodyText.includes(searchText)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

/**
 * Affiche les informations d'un bébé
 */
function displayBabyInfo(data) {
    const babyInfo = document.getElementById('baby-info');
    if (!babyInfo) return;
    
    const babyName = data.first_name ? `${data.first_name} ${data.last_name}` : `Bébé de ${data.mother_name}`;
    const birthDate = new Date(data.birth_date).toLocaleDateString('fr-FR');
    const ageInDays = Math.floor((new Date() - new Date(data.birth_date)) / (1000 * 60 * 60 * 24));
    
    let content = `
        <div class="card mb-4">
            <div class="card-header bg-light">
                <h5 class="mb-0">${babyName}</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Date de naissance:</strong> ${birthDate}</p>
                        <p><strong>Âge:</strong> ${ageInDays} jours</p>
                        <p><strong>Sexe:</strong> ${data.gender === 'M' ? 'Masculin' : (data.gender === 'F' ? 'Féminin' : 'Autre')}</p>
                        <p><strong>Poids à la naissance:</strong> ${data.birth_weight} g</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Taille à la naissance:</strong> ${data.birth_length || 'Non renseigné'} cm</p>
                        <p><strong>PC à la naissance:</strong> ${data.head_circumference || 'Non renseigné'} cm</p>
                        <p><strong>Apgar:</strong> ${data.apgar_1min || '-'}/${data.apgar_5min || '-'}/${data.apgar_10min || '-'}</p>
                        <p><strong>Type d'accouchement:</strong> ${data.delivery_type}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Afficher les dernières observations
    if (data.checkups && data.checkups.length > 0) {
        content += `
            <div class="card">
                <div class="card-header bg-light">
                    <h5 class="mb-0">Dernières observations</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Poids</th>
                                    <th>Temp.</th>
                                    <th>FC</th>
                                    <th>FR</th>
                                    <th>Observations</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        data.checkups.slice(0, 5).forEach(checkup => {
            const checkupDate = new Date(checkup.checkup_date).toLocaleDateString('fr-FR');
            content += `
                <tr>
                    <td>${checkupDate}</td>
                    <td>${checkup.weight ? `${checkup.weight} kg` : '-'}</td>
                    <td>${checkup.temperature ? `${checkup.temperature} °C` : '-'}</td>
                    <td>${checkup.heart_rate || '-'}</td>
                    <td>${checkup.respiratory_rate || '-'}</td>
                    <td>${checkup.symptoms || '-'}</td>
                </tr>
            `;
        });
        
        content += `
                            </tbody>
                        </table>
                    </div>
                    <button class="btn btn-outline-primary btn-sm mt-2" id="view-all-checkups-btn">
                        Voir tous les examens
                    </button>
                </div>
            </div>
        `;
    }
    
    babyInfo.innerHTML = content;
}

/**
 * Affiche les suivis post-partum d'une mère
 */
function displayMotherCheckups(data) {
    const checkupHistory = document.getElementById('mother-checkup-history');
    const recoveryProgress = document.getElementById('mother-recovery-progress');
    
    if (!checkupHistory || !recoveryProgress) return;
    
    if (!data.checkups || data.checkups.length === 0) {
        checkupHistory.innerHTML = '<div class="alert alert-info">Aucun suivi post-partum enregistré pour cette patiente.</div>';
        recoveryProgress.innerHTML = '<p class="text-muted">Aucune donnée de récupération disponible.</p>';
        return;
    }
    
    // Afficher l'historique des suivis
    let checkupsHtml = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Tension</th>
                        <th>FC</th>
                        <th>Temp.</th>
                        <th>Symptômes</th>
                        <th>Recommandations</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    data.checkups.forEach(checkup => {
        const checkupDate = new Date(checkup.checkup_date).toLocaleDateString('fr-FR');
        const bp = `${checkup.blood_pressure_systolic || '-'}/${checkup.blood_pressure_diastolic || '-'}`;
        
        checkupsHtml += `
            <tr>
                <td>${checkupDate}</td>
                <td>${bp}</td>
                <td>${checkup.heart_rate || '-'}</td>
                <td>${checkup.temperature ? `${checkup.temperature} °C` : '-'}</td>
                <td>${checkup.symptoms || '-'}</td>
                <td>${checkup.recommendations || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-checkup-details" data-checkup-id="${checkup.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    checkupsHtml += `
                </tbody>
            </table>
        </div>
        <button class="btn btn-outline-primary btn-sm mt-2" data-bs-toggle="modal" data-bs-target="#addMotherCheckupModal">
            Nouvel examen
        </button>
    `;
    
    checkupHistory.innerHTML = checkupsHtml;
    
    // Afficher le progrès de récupération
    // Calculer les jours depuis l'accouchement
    const deliveryDate = new Date(data.delivery_date);
    const today = new Date();
    const daysSinceDelivery = Math.floor((today - deliveryDate) / (1000 * 60 * 60 * 24));
    
    let recoveryHtml = `
        <div class="recovery-info mb-3">
            <p><strong>Jours depuis l'accouchement:</strong> ${daysSinceDelivery}</p>
            <p><strong>Type d'accouchement:</strong> ${data.delivery_type}</p>
            <p><strong>Complications:</strong> ${data.complications || 'Aucune'}</p>
        </div>
        
        <h6>Progrès de récupération</h6>
        <div class="recovery-progress-items">
    `;
    
    // Éléments de récupération
    const recoveryItems = [
        { name: 'Involution utérine', progress: calculateProgress(daysSinceDelivery, 42, data.checkups) },
        { name: 'Cicatrisation périnéale', progress: calculateProgress(daysSinceDelivery, 14, data.checkups) },
        { name: 'Saignements post-partum', progress: calculateProgress(daysSinceDelivery, 21, data.checkups) },
        { name: 'État émotionnel', progress: calculateProgress(daysSinceDelivery, 30, data.checkups) }
    ];
    
    recoveryItems.forEach(item => {
        recoveryHtml += `
            <div class="recovery-item mb-2">
                <div class="d-flex justify-content-between">
                    <span>${item.name}</span>
                    <span>${item.progress}%</span>
                </div>
                <div class="progress" style="height: 10px;">
                    <div class="progress-bar ${getProgressBarClass(item.progress)}" role="progressbar" style="width: ${item.progress}%" aria-valuenow="${item.progress}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        `;
    });
    
    recoveryHtml += `
        </div>
        
        <h6 class="mt-3">Recommandations actuelles</h6>
        <ul class="recommendations-list">
            ${generateRecommendations(daysSinceDelivery, data.delivery_type).map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    `;
    
    recoveryProgress.innerHTML = recoveryHtml;
    
    // Ajouter les gestionnaires d'événements pour les boutons de détails
    document.querySelectorAll('.view-checkup-details').forEach(button => {
        button.addEventListener('click', function() {
            const checkupId = this.getAttribute('data-checkup-id');
            viewCheckupDetails(checkupId);
        });
    });
}

/**
 * Calcule le pourcentage de progression pour un aspect de la récupération
 */
function calculateProgress(days, maxDays, checkups) {
    // Base sur le temps écoulé et les données des examens
    let baseProgress = Math.min(100, Math.round((days / maxDays) * 100));
    
    // Ajuster en fonction des examens
    if (checkups && checkups.length > 0) {
        // Logique simplifiée pour la démonstration
        // Dans un cas réel, on analyserait les symptômes et examens
        const lastCheckup = checkups[0];
        if (lastCheckup.symptoms && lastCheckup.symptoms.toLowerCase().includes('complication')) {
            baseProgress = Math.max(0, baseProgress - 20);
        }
    }
    
    return baseProgress;
}

/**
 * Génère des recommandations en fonction du nombre de jours depuis l'accouchement
 */
function generateRecommendations(days, deliveryType) {
    const recommendations = [];
    
    if (days < 7) {
        recommendations.push('Repos fréquent et récupération');
        recommendations.push('Surveiller les saignements et la température');
        recommendations.push('Boire beaucoup d\'eau et alimentation équilibrée');
        
        if (deliveryType.includes('cesarean')) {
            recommendations.push('Surveiller la cicatrice de césarienne');
            recommendations.push('Éviter de soulever des objets lourds');
        }
    } else if (days < 21) {
        recommendations.push('Reprendre progressivement les activités légères');
        recommendations.push('Continuer à surveiller les saignements');
        recommendations.push('Exercices de renforcement du plancher pelvien');
        
        if (deliveryType.includes('cesarean')) {
            recommendations.push('Éviter les exercices abdominaux avant 6 semaines');
        }
    } else if (days < 42) {
        recommendations.push('Augmenter progressivement l\'activité physique');
        recommendations.push('Visite post-partum à 6 semaines');
        recommendations.push('Discuter de la contraception lors de la visite');
    } else {
        recommendations.push('Retour aux activités normales si autorisé médicalement');
        recommendations.push('Suivi gynécologique annuel recommandé');
    }
    
    return recommendations;
}

/**
 * Retourne la classe CSS appropriée pour la barre de progression
 */
function getProgressBarClass(progress) {
    if (progress < 25) return 'bg-danger';
    if (progress < 50) return 'bg-warning';
    if (progress < 75) return 'bg-info';
    return 'bg-success';
}

/**
 * Met à jour le graphique des signes vitaux de la mère avec les données reçues
 */
function updateMotherVitalsChart(data) {
    if (!data.checkups || data.checkups.length === 0) return;
    
    const chartCanvas = document.getElementById('mother-vitals-chart');
    if (!chartCanvas) return;
    
    const chart = Chart.getChart(chartCanvas);
    if (!chart) return;
    
    // Trier les suivis par date (du plus ancien au plus récent)
    const sortedCheckups = [...data.checkups].sort((a, b) => 
        new Date(a.checkup_date) - new Date(b.checkup_date)
    );
    
    // Préparer les données pour le graphique
    const labels = sortedCheckups.map(checkup => 
        new Date(checkup.checkup_date).toLocaleDateString('fr-FR')
    );
    
    const systolicData = sortedCheckups.map(checkup => checkup.blood_pressure_systolic);
    const diastolicData = sortedCheckups.map(checkup => checkup.blood_pressure_diastolic);
    const heartRateData = sortedCheckups.map(checkup => checkup.heart_rate);
    const temperatureData = sortedCheckups.map(checkup => checkup.temperature);
    
    // Mettre à jour le graphique
    chart.data.labels = labels;
    chart.data.datasets[0].data = systolicData;
    chart.data.datasets[1].data = diastolicData;
    chart.data.datasets[2].data = heartRateData;
    chart.data.datasets[3].data = temperatureData;
    
    chart.update();
}

/**
 * Met à jour les graphiques du bébé avec les données reçues
 */
function updateBabyCharts(data) {
    if (!data.checkups || data.checkups.length === 0) return;
    
    // Mettre à jour le graphique de croissance
    updateBabyGrowthChart(data);
    
    // Mettre à jour le graphique des signes vitaux
    updateBabyVitalsChart(data);
}

/**
 * Met à jour le graphique de croissance du bébé
 */
function updateBabyGrowthChart(data) {
    const chartCanvas = document.getElementById('baby-growth-chart');
    if (!chartCanvas) return;
    
    const chart = Chart.getChart(chartCanvas);
    if (!chart) return;
    
    // Trier les suivis par date (du plus ancien au plus récent)
    const sortedCheckups = [...data.checkups].sort((a, b) => 
        new Date(a.checkup_date) - new Date(b.checkup_date)
    );
    
    // Commencer avec le poids et la taille de naissance
    const labels = ['Naissance'];
    const weightData = [data.birth_weight / 1000]; // Convertir en kg
    const lengthData = [data.birth_length];
    
    // Ajouter les données des suivis
    sortedCheckups.forEach(checkup => {
        labels.push(new Date(checkup.checkup_date).toLocaleDateString('fr-FR'));
        weightData.push(checkup.weight);
        lengthData.push(checkup.length);
    });
    
    // Mettre à jour le graphique
    chart.data.labels = labels;
    chart.data.datasets[0].data = weightData;
    chart.data.datasets[1].data = lengthData;
    
    chart.update();
}

/**
 * Met à jour le graphique des signes vitaux du bébé
 */
function updateBabyVitalsChart(data) {
    const chartCanvas = document.getElementById('baby-vitals-chart');
    if (!chartCanvas) return;
    
    const chart = Chart.getChart(chartCanvas);
    if (!chart) return;
    
    // Trier les suivis par date (du plus ancien au plus récent)
    const sortedCheckups = [...data.checkups].sort((a, b) => 
        new Date(a.checkup_date) - new Date(b.checkup_date)
    );
    
    // Préparer les données pour le graphique
    const labels = sortedCheckups.map(checkup => 
        new Date(checkup.checkup_date).toLocaleDateString('fr-FR')
    );
    
    const heartRateData = sortedCheckups.map(checkup => checkup.heart_rate);
    const respiratoryRateData = sortedCheckups.map(checkup => checkup.respiratory_rate);
    const temperatureData = sortedCheckups.map(checkup => checkup.temperature);
    
    // Mettre à jour le graphique
    chart.data.labels = labels;
    chart.data.datasets[0].data = heartRateData;
    chart.data.datasets[1].data = respiratoryRateData;
    chart.data.datasets[2].data = temperatureData;
    
    chart.update();
}

/**
 * Met à jour le graphique d'allaitement
 */
function updateBreastfeedingChart(data) {
    if (!data.records || data.records.length === 0) return;
    
    const chartCanvas = document.getElementById('breastfeeding-chart');
    if (!chartCanvas) return;
    
    const chart = Chart.getChart(chartCanvas);
    if (!chart) return;
    
    // Regrouper les records par jour
    const recordsByDay = {};
    
    data.records.forEach(record => {
        const dateStr = new Date(record.feeding_date).toLocaleDateString('fr-FR');
        
        if (!recordsByDay[dateStr]) {
            recordsByDay[dateStr] = {
                count: 0,
                totalDuration: 0
            };
        }
        
        recordsByDay[dateStr].count++;
        recordsByDay[dateStr].totalDuration += (record.duration || 0);
    });
    
    // Préparer les données pour le graphique
    const labels = Object.keys(recordsByDay);
    const countData = labels.map(date => recordsByDay[date].count);
    const durationData = labels.map(date => 
        recordsByDay[date].totalDuration / recordsByDay[date].count // Durée moyenne
    );
    
    // Mettre à jour le graphique
    chart.data.labels = labels;
    chart.data.datasets[0].data = durationData;
    chart.data.datasets[1].data = countData;
    
    chart.update();
}

/**
 * Affiche les enregistrements d'allaitement
 */
function displayBreastfeedingRecords(data) {
    const breastfeedingHistory = document.getElementById('breastfeeding-history');
    
    if (!breastfeedingHistory) return;
    
    if (!data.records || data.records.length === 0) {
        breastfeedingHistory.innerHTML = '<div class="alert alert-info">Aucun enregistrement d\'allaitement trouvé pour ce bébé.</div>';
        return;
    }
    
    // Regrouper les records par jour
    const recordsByDay = {};
    
    data.records.forEach(record => {
        const date = new Date(record.feeding_date);
        const dateStr = date.toLocaleDateString('fr-FR');
        
        if (!recordsByDay[dateStr]) {
            recordsByDay[dateStr] = [];
        }
        
        recordsByDay[dateStr].push({
            ...record,
            timeStr: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        });
    });
    
    // Trier les dates du plus récent au plus ancien
    const sortedDates = Object.keys(recordsByDay).sort((a, b) => 
        new Date(b.split('/').reverse().join('-')) - new Date(a.split('/').reverse().join('-'))
    );
    
    let html = '';
    
    sortedDates.forEach(dateStr => {
        html += `
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0">${dateStr}</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-sm table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Heure</th>
                                    <th>Type</th>
                                    <th>Durée</th>
                                    <th>Problèmes</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        recordsByDay[dateStr].forEach(record => {
            html += `
                <tr>
                    <td>${record.timeStr}</td>
                    <td>${translateFeedingType(record.feeding_type)}</td>
                    <td>${record.duration ? `${record.duration} min` : '-'}</td>
                    <td>${record.issues || '-'}</td>
                    <td>${record.notes || '-'}</td>
                </tr>
            `;
        });
        
        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
        <button class="btn btn-outline-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addBreastfeedingRecordModal">
            Ajouter un enregistrement
        </button>
    `;
    
    breastfeedingHistory.innerHTML = html;
}

/**
 * Traduit le type d'allaitement en français
 */
function translateFeedingType(type) {
    const translations = {
        'exclusive_breastfeeding': 'Allaitement exclusif',
        'mixed': 'Mixte',
        'formula': 'Lait artificiel'
    };
    
    return translations[type] || type;
}

/**
 * Affiche les vaccinations du bébé
 */
function displayVaccinationRecords(data) {
    const vaccinationHistory = document.getElementById('vaccination-history');
    
    if (!vaccinationHistory) return;
    
    if (!data.vaccinations || data.vaccinations.length === 0) {
        vaccinationHistory.innerHTML = '<div class="alert alert-info">Aucun record de vaccination trouvé pour ce bébé.</div>';
        return;
    }
    
    // Trier les vaccinations par date (du plus récent au plus ancien)
    const sortedVaccinations = [...data.vaccinations].sort((a, b) => 
        new Date(b.date_administered) - new Date(a.date_administered)
    );
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Vaccin</th>
                        <th>Dose</th>
                        <th>Voie</th>
                        <th>Site</th>
                        <th>Lot</th>
                        <th>Réaction</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    sortedVaccinations.forEach(vaccination => {
        const vaccinationDate = new Date(vaccination.date_administered).toLocaleDateString('fr-FR');
        
        html += `
            <tr>
                <td>${vaccinationDate}</td>
                <td>${vaccination.vaccine_name}</td>
                <td>${vaccination.dose || '-'}</td>
                <td>${vaccination.route || '-'}</td>
                <td>${vaccination.site || '-'}</td>
                <td>${vaccination.lot_number || '-'}</td>
                <td>${vaccination.reaction || 'Aucune'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-vaccination-details" data-vaccination-id="${vaccination.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <button class="btn btn-outline-primary btn-sm mt-2" data-bs-toggle="modal" data-bs-target="#addVaccinationModal">
            Ajouter une vaccination
        </button>
    `;
    
    vaccinationHistory.innerHTML = html;
    
    // Ajouter les gestionnaires d'événements pour les boutons de détails
    document.querySelectorAll('.view-vaccination-details').forEach(button => {
        button.addEventListener('click', function() {
            const vaccinationId = this.getAttribute('data-vaccination-id');
            viewVaccinationDetails(vaccinationId);
        });
    });
}

/**
 * Affiche les rappels filtrés
 */
function displayReminders(data) {
    const remindersTable = document.getElementById('reminders-table');
    
    if (!remindersTable) return;
    
    const tbody = remindersTable.querySelector('tbody');
    
    if (!data.reminders || data.reminders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">Aucun rappel trouvé avec les filtres actuels.</td></tr>`;
        return;
    }
    
    let html = '';
    
    data.reminders.forEach(reminder => {
        const reminderDate = new Date(reminder.reminder_date).toLocaleDateString('fr-FR');
        const priorityClass = {
            'high': 'danger',
            'normal': 'primary',
            'low': 'secondary'
        }[reminder.priority] || 'primary';
        
        const statusClass = reminder.completed ? 'success' : 'warning';
        const statusText = reminder.completed ? 'Complété' : 'À venir';
        
        html += `
            <tr>
                <td>${reminderDate}</td>
                <td>${reminder.title}</td>
                <td>${translateReminderType(reminder.reminder_type)}</td>
                <td>${reminder.patient_name || reminder.baby_name || '-'}</td>
                <td><span class="badge bg-${priorityClass}">${translatePriority(reminder.priority)}</span></td>
                <td><span class="badge bg-${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-reminder-details" data-reminder-id="${reminder.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${!reminder.completed ? `
                        <button class="btn btn-sm btn-outline-success complete-reminder" data-reminder-id="${reminder.id}">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Ajouter les gestionnaires d'événements pour les boutons
    document.querySelectorAll('.view-reminder-details').forEach(button => {
        button.addEventListener('click', function() {
            const reminderId = this.getAttribute('data-reminder-id');
            viewReminderDetails(reminderId);
        });
    });
    
    document.querySelectorAll('.complete-reminder').forEach(button => {
        button.addEventListener('click', function() {
            const reminderId = this.getAttribute('data-reminder-id');
            completeReminder(reminderId);
        });
    });
}

/**
 * Traduit le type de rappel en français
 */
function translateReminderType(type) {
    const translations = {
        'mother': 'Mère',
        'baby': 'Bébé',
        'both': 'Les deux'
    };
    
    return translations[type] || type;
}

/**
 * Traduit la priorité en français
 */
function translatePriority(priority) {
    const translations = {
        'high': 'Haute',
        'normal': 'Normale',
        'low': 'Basse'
    };
    
    return translations[priority] || priority;
}

/**
 * Affiche un message d'erreur
 */
function showError(message) {
    // Créer une alerte de type toast pour le message d'erreur
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    
    toastContainer.innerHTML = `
        <div class="toast align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-exclamation-circle me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button>
            </div>
        </div>
    `;
    
    document.body.appendChild(toastContainer);
    
    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
    
    toast.show();
    
    // Supprimer le toast container après la fermeture
    toastElement.addEventListener('hidden.bs.toast', function() {
        document.body.removeChild(toastContainer);
    });
}

/**
 * Affiche un message de succès
 */
function showSuccess(message) {
    // Créer une alerte de type toast pour le message de succès
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    
    toastContainer.innerHTML = `
        <div class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-check-circle me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button>
            </div>
        </div>
    `;
    
    document.body.appendChild(toastContainer);
    
    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
    
    toast.show();
    
    // Supprimer le toast container après la fermeture
    toastElement.addEventListener('hidden.bs.toast', function() {
        document.body.removeChild(toastContainer);
    });
}

/**
 * Soumet le formulaire d'ajout d'examen pour une mère
 */
function submitMotherCheckupForm() {
    const form = document.getElementById('add-mother-checkup-form');
    if (!form) return;
    
    // Vérifier la validité du formulaire
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Collecter les données du formulaire
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Envoyer les données à l'API
    fetch('/api/postnatal/checkup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de l\'enregistrement de l\'examen');
        }
        return response.json();
    })
    .then(data => {
        // Fermer la modale
        const modal = bootstrap.Modal.getInstance(document.getElementById('addMotherCheckupModal'));
        if (modal) modal.hide();
        
        // Réinitialiser le formulaire
        form.reset();
        
        // Afficher un message de succès
        showSuccess('Examen post-partum enregistré avec succès');
        
        // Recharger les données si un patient est sélectionné
        const motherSelect = document.getElementById('mother-select');
        if (motherSelect && motherSelect.value) {
            loadMotherCheckups(motherSelect.value);
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        showError('Erreur lors de l\'enregistrement de l\'examen');
    });
}

/**
 * Soumet le formulaire d'ajout d'examen pour un bébé
 */
function submitBabyCheckupForm() {
    const form = document.getElementById('add-baby-checkup-form');
    if (!form) return;
    
    // Vérifier la validité du formulaire
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Collecter les données du formulaire
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Envoyer les données à l'API
    fetch('/api/postnatal/checkup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de l\'enregistrement de l\'examen');
        }
        return response.json();
    })
    .then(data => {
        // Fermer la modale
        const modal = bootstrap.Modal.getInstance(document.getElementById('addBabyCheckupModal'));
        if (modal) modal.hide();
        
        // Réinitialiser le formulaire
        form.reset();
        
        // Afficher un message de succès
        showSuccess('Examen du bébé enregistré avec succès');
        
        // Recharger les données si un bébé estsélectionné
        const babySelect = document.getElementById('baby-select');
        if (babySelect && babySelect.value) {
            loadBabyInfo(babySelect.value);
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        showError('Erreur lors de l\'enregistrement de l\'examen');
    });
}

/**
 * Soumet le formulaire d'ajout d'allaitement
 */
function submitBreastfeedingForm() {
    const form = document.getElementById('add-breastfeeding-form');
    if (!form) return;
    
    // Vérifier la validité du formulaire
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Collecter les données du formulaire
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Ajouter l'ID de la mère (récupéré à partir du bébé)
    const babyId = formData.get('baby_id');
    
    // Rechercher la mère associée au bébé
    fetch(`/api/postnatal/baby/${babyId}`)
        .then(response => {
            if (!response.ok) throw new Error('Erreur lors de la récupération des informations du bébé');
            return response.json();
        })
        .then(babyData => {
            data.mother_id = babyData.mother_id;
            
            // Maintenant envoyer les données d'allaitement
            return fetch('/api/postnatal/breastfeeding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        })
        .then(response => {
            if (!response.ok) throw new Error('Erreur lors de l\'enregistrement de l\'allaitement');
            return response.json();
        })
        .then(responseData => {
            // Fermer la modale
            const modal = bootstrap.Modal.getInstance(document.getElementById('addBreastfeedingRecordModal'));
            if (modal) modal.hide();
            
            // Réinitialiser le formulaire
            form.reset();
            
            // Afficher un message de succès
            showSuccess('Enregistrement d\'allaitement ajouté avec succès');
            
            // Recharger les données
            const breastfeedingBabySelect = document.getElementById('breastfeeding-baby-select');
            if (breastfeedingBabySelect && breastfeedingBabySelect.value) {
                loadBreastfeedingRecords(breastfeedingBabySelect.value);
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showError('Erreur lors de l\'enregistrement de l\'allaitement');
        });
}

/**
 * Soumet le formulaire d'ajout de vaccination
 */
function submitVaccinationForm() {
    const form = document.getElementById('add-vaccination-form');
    if (!form) return;
    
    // Vérifier la validité du formulaire
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Collecter les données du formulaire
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Gérer le cas où le vaccin est "autre"
    if (data.vaccine_name === 'other') {
        const otherVaccineName = document.getElementById('other-vaccine-name').value;
        if (!otherVaccineName) {
            showError('Veuillez préciser le nom du vaccin');
            return;
        }
        data.vaccine_name = otherVaccineName;
    }
    
    // Envoyer les données à l'API
    fetch('/api/postnatal/vaccination', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de l\'enregistrement de la vaccination');
        }
        return response.json();
    })
    .then(data => {
        // Fermer la modale
        const modal = bootstrap.Modal.getInstance(document.getElementById('addVaccinationModal'));
        if (modal) modal.hide();
        
        // Réinitialiser le formulaire
        form.reset();
        
        // Afficher un message de succès
        showSuccess('Vaccination enregistrée avec succès');
        
        // Recharger les données
        const vaccinationBabySelect = document.getElementById('vaccination-baby-select');
        if (vaccinationBabySelect && vaccinationBabySelect.value) {
            loadVaccinationRecords(vaccinationBabySelect.value);
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        showError('Erreur lors de l\'enregistrement de la vaccination');
    });
}

/**
 * Soumet le formulaire d'ajout de rappel
 */
function submitReminderForm() {
    const form = document.getElementById('add-reminder-form');
    if (!form) return;
    
    // Vérifier la validité du formulaire
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Collecter les données du formulaire
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Vérifier que les bons champs sont présents selon le type de rappel
    const reminderType = data.reminder_type;
    
    if ((reminderType === 'mother' || reminderType === 'both') && !data.patient_id) {
        showError('Veuillez sélectionner une patiente');
        return;
    }
    
    if ((reminderType === 'baby' || reminderType === 'both') && !data.baby_id) {
        showError('Veuillez sélectionner un bébé');
        return;
    }
    
    // Envoyer les données à l'API
    fetch('/api/postnatal/reminder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de l\'enregistrement du rappel');
        }
        return response.json();
    })
    .then(data => {
        // Fermer la modale
        const modal = bootstrap.Modal.getInstance(document.getElementById('addReminderModal'));
        if (modal) modal.hide();
        
        // Réinitialiser le formulaire
        form.reset();
        
        // Afficher un message de succès
        showSuccess('Rappel enregistré avec succès');
        
        // Recharger les rappels
        filterReminders();
        
        // Recharger les rappels à venir dans la sidebar
        loadReminders();
    })
    .catch(error => {
        console.error('Erreur:', error);
        showError('Erreur lors de l\'enregistrement du rappel');
    });
}

/**
 * Fonction pour charger tous les accouchements
 */
function loadDeliveries() {
    // Requête à l'API pour récupérer les accouchements
    fetch('/api/postnatal/deliveries')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des accouchements');
            }
            return response.json();
        })
        .then(data => {
            displayDeliveries(data.deliveries);
        })
        .catch(error => {
            console.error('Erreur:', error);
            showError('Impossible de charger les accouchements');
        });
}

/**
 * Fonction pour afficher les accouchements dans le tableau
 */
function displayDeliveries(deliveries) {
    const deliveriesTable = document.getElementById('deliveries-table');
    if (!deliveriesTable) return;
    
    const tbody = deliveriesTable.querySelector('tbody');
    if (!tbody) return;
    
    // Vider le tableau
    tbody.innerHTML = '';
    
    // Si aucun accouchement, afficher un message
    if (!deliveries || deliveries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Aucun accouchement enregistré</td></tr>';
        return;
    }
    
    // Remplir le tableau avec les données
    deliveries.forEach(delivery => {
        const deliveryDate = new Date(delivery.delivery_date).toLocaleDateString('fr-FR');
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${deliveryDate}</td>
            <td>${delivery.patient_name}</td>
            <td>${translateDeliveryType(delivery.delivery_type)}</td>
            <td>${delivery.delivery_location}</td>
            <td>${delivery.complications || '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-delivery-details" data-delivery-id="${delivery.id}">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Ajouter les gestionnaires d'événements pour les boutons de détails
    document.querySelectorAll('.view-delivery-details').forEach(button => {
        button.addEventListener('click', function() {
            const deliveryId = this.getAttribute('data-delivery-id');
            viewDeliveryDetails(deliveryId);
        });
    });
}

/**
 * Traduit le type d'accouchement en français
 */
function translateDeliveryType(type) {
    const translations = {
        'vaginal': 'Vaginal spontané',
        'instrumental': 'Instrumental',
        'cesarean_planned': 'Césarienne programmée',
        'cesarean_emergency': 'Césarienne en urgence'
    };
    
    return translations[type] || type;
}

/**
 * Charge la liste des bébés
 */
function loadBabies() {
    fetch('/api/postnatal/babies')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des bébés');
            }
            return response.json();
        })
        .then(data => {
            populateBabySelectors(data.babies);
        })
        .catch(error => {
            console.error('Erreur:', error);
            showError('Impossible de charger la liste des bébés');
        });
}

/**
 * Remplit les sélecteurs de bébés avec les données
 */
function populateBabySelectors(babies) {
    const selectors = [
        document.getElementById('baby-select'),
        document.getElementById('baby-checkup-baby'),
        document.getElementById('breastfeeding-baby'),
        document.getElementById('vaccination-baby'),
        document.getElementById('reminder-baby')
    ];
    
    selectors.forEach(selector => {
        if (selector) {
            // Vider les options existantes sauf la première
            while (selector.options.length > 1) {
                selector.remove(1);
            }
            
            // Ajouter les bébés
            babies.forEach(baby => {
                const option = document.createElement('option');
                option.value = baby.id;
                option.textContent = baby.first_name ? 
                    `${baby.first_name} ${baby.last_name}` : 
                    `Bébé de ${baby.mother_name}`;
                selector.appendChild(option);
            });
        }
    });
}

/**
 * Affiche les détails d'un accouchement
 */
function viewDeliveryDetails(deliveryId) {
    fetch(`/api/postnatal/delivery/${deliveryId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des détails de l\'accouchement');
            }
            return response.json();
        })
        .then(data => {
            // Afficher les détails dans une modale
            const modal = new bootstrap.Modal(document.getElementById('checkupDetailsModal'));
            const modalContent = document.getElementById('checkup-details-content');
            
            if (!modalContent) return;
            
            const deliveryDate = new Date(data.delivery_date).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Créer le contenu HTML pour les détails
            let content = `
                <div class="delivery-details">
                    <h5 class="text-primary mb-3">Informations sur l'accouchement</h5>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p><strong>Patiente:</strong> ${data.patient_name}</p>
                            <p><strong>Date et heure:</strong> ${deliveryDate}</p>
                            <p><strong>Type:</strong> ${translateDeliveryType(data.delivery_type)}</p>
                            <p><strong>Lieu:</strong> ${data.delivery_location}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Durée du travail:</strong> ${data.delivery_duration ? `${data.delivery_duration} minutes` : 'Non renseignée'}</p>
                            <p><strong>Pertes sanguines:</strong> ${data.blood_loss ? `${data.blood_loss} mL` : 'Non renseignées'}</p>
                            <p><strong>Anesthésie:</strong> ${data.anesthesia_type || 'Aucune'}</p>
                            <p><strong>Complications:</strong> ${data.complications || 'Aucune'}</p>
                        </div>
                    </div>
                    
                    <h5 class="text-primary mb-3">Informations sur le bébé</h5>
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Nom:</strong> ${data.baby.first_name ? `${data.baby.first_name} ${data.baby.last_name}` : 'Non renseigné'}</p>
                            <p><strong>Sexe:</strong> ${data.baby.gender === 'M' ? 'Masculin' : (data.baby.gender === 'F' ? 'Féminin' : 'Autre/Non renseigné')}</p>
                            <p><strong>Poids:</strong> ${data.baby.birth_weight} g</p>
                            <p><strong>Taille:</strong> ${data.baby.birth_length ? `${data.baby.birth_length} cm` : 'Non renseignée'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Périmètre crânien:</strong> ${data.baby.head_circumference ? `${data.baby.head_circumference} cm` : 'Non renseigné'}</p>
                            <p><strong>Apgar:</strong> ${data.baby.apgar_1min || '-'}/${data.baby.apgar_5min || '-'}/${data.baby.apgar_10min || '-'}</p>
                            <p><strong>Réanimation:</strong> ${data.baby.resuscitation_required ? 'Oui' : 'Non'}</p>
                            <p><strong>Admission en néonatologie:</strong> ${data.baby.nicu_required ? 'Oui' : 'Non'}</p>
                        </div>
                    </div>
                    
                    ${data.baby.resuscitation_details ? `
                    <div class="alert alert-warning mt-3">
                        <h6 class="mb-2">Détails de la réanimation:</h6>
                        <p class="mb-0">${data.baby.resuscitation_details}</p>
                    </div>
                    ` : ''}
                    
                    ${data.baby.congenital_anomalies ? `
                    <div class="alert alert-info mt-3">
                        <h6 class="mb-2">Anomalies congénitales / Remarques:</h6>
                        <p class="mb-0">${data.baby.congenital_anomalies}</p>
                    </div>
                    ` : ''}
                    
                    ${data.notes ? `
                    <div class="alert alert-light mt-3">
                        <h6 class="mb-2">Notes additionnelles:</h6>
                        <p class="mb-0">${data.notes}</p>
                    </div>
                    ` : ''}
                </div>
            `;
            
            modalContent.innerHTML = content;
            modal.show();
        })
        .catch(error => {
            console.error('Erreur:', error);
            showError('Impossible de charger les détails de l\'accouchement');
        });
}

/**
 * Affiche les détails d'un examen
 */
function viewCheckupDetails(checkupId) {
    fetch(`/api/postnatal/checkup/${checkupId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des détails de l\'examen');
            }
            return response.json();
        })
        .then(data => {
            // Afficher les détails dans une modale
            const modal = new bootstrap.Modal(document.getElementById('checkupDetailsModal'));
            const modalContent = document.getElementById('checkup-details-content');
            
            if (!modalContent) return;
            
            const checkupDate = new Date(data.checkup_date).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Créer le contenu HTML pour les détails
            let content = `
                <div class="checkup-details">
                    <h5 class="text-primary mb-3">Détails de l'examen ${data.checkup_type === 'mother' ? 'de la mère' : 'du bébé'}</h5>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p><strong>Patient:</strong> ${data.patient_name || data.baby_name}</p>
                            <p><strong>Date et heure:</strong> ${checkupDate}</p>
                            <p><strong>Type d'examen:</strong> ${data.checkup_type === 'mother' ? 'Mère' : 'Bébé'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Température:</strong> ${data.temperature ? `${data.temperature} °C` : 'Non renseignée'}</p>
                            <p><strong>Fréquence cardiaque:</strong> ${data.heart_rate ? `${data.heart_rate} bpm` : 'Non renseignée'}</p>
                            ${data.checkup_type === 'mother' ? `
                            <p><strong>Tension artérielle:</strong> ${data.blood_pressure_systolic && data.blood_pressure_diastolic ? `${data.blood_pressure_systolic}/${data.blood_pressure_diastolic} mmHg` : 'Non renseignée'}</p>
                            ` : `
                            <p><strong>Fréquence respiratoire:</strong> ${data.respiratory_rate ? `${data.respiratory_rate} resp/min` : 'Non renseignée'}</p>
                            `}
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-12">
                            <h6 class="mb-2">Symptômes / Observations:</h6>
                            <p>${data.symptoms || 'Aucun symptôme noté'}</p>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-12">
                            <h6 class="mb-2">Examen physique:</h6>
                            <p>${data.physical_exam || 'Aucun détail noté'}</p>
                        </div>
                    </div>
                    
                    ${data.medications ? `
                    <div class="row mb-3">
                        <div class="col-md-12">
                            <h6 class="mb-2">Médicaments:</h6>
                            <p>${data.medications}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${data.recommendations ? `
                    <div class="row mb-3">
                        <div class="col-md-12">
                            <h6 class="mb-2">Recommandations:</h6>
                            <p>${data.recommendations}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${data.next_checkup_date ? `
                    <div class="alert alert-info mt-3">
                        <p class="mb-0"><strong>Prochain examen prévu le:</strong> ${new Date(data.next_checkup_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    ` : ''}
                    
                    ${data.notes ? `
                    <div class="alert alert-light mt-3">
                        <h6 class="mb-2">Notes additionnelles:</h6>
                        <p class="mb-0">${data.notes}</p>
                    </div>
                    ` : ''}
                </div>
            `;
            
            modalContent.innerHTML = content;
            modal.show();
        })
        .catch(error => {
            console.error('Erreur:', error);
            showError('Impossible de charger les détails de l\'examen');
        });
}

/**
 * Affiche les détails d'une vaccination
 */
function viewVaccinationDetails(vaccinationId) {
    fetch(`/api/postnatal/vaccination/${vaccinationId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des détails de la vaccination');
            }
            return response.json();
        })
        .then(data => {
            // Afficher les détails dans une modale
            const modal = new bootstrap.Modal(document.getElementById('checkupDetailsModal'));
            const modalContent = document.getElementById('checkup-details-content');
            
            if (!modalContent) return;
            
            const vaccinationDate = new Date(data.date_administered).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            let expirationDate = 'Non renseignée';
            if (data.expiration_date) {
                expirationDate = new Date(data.expiration_date).toLocaleDateString('fr-FR');
            }
            
            // Créer le contenu HTML pour les détails
            let content = `
                <div class="vaccination-details">
                    <h5 class="text-primary mb-3">Détails de la Vaccination</h5>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p><strong>Bébé:</strong> ${data.baby_name}</p>
                            <p><strong>Vaccin:</strong> ${data.vaccine_name}</p>
                            <p><strong>Date d'administration:</strong> ${vaccinationDate}</p>
                            <p><strong>Dose:</strong> ${data.dose || 'Non renseignée'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Voie d'administration:</strong> ${data.route || 'Non renseignée'}</p>
                            <p><strong>Site d'injection:</strong> ${data.site || 'Non renseigné'}</p>
                            <p><strong>Numéro de lot:</strong> ${data.lot_number || 'Non renseigné'}</p>
                            <p><strong>Date d'expiration:</strong> ${expirationDate}</p>
                        </div>
                    </div>
                    
                    ${data.reaction ? `
                    <div class="alert alert-warning mt-3">
                        <h6 class="mb-2">Réaction:</h6>
                        <p class="mb-0">${data.reaction}</p>
                    </div>
                    ` : ''}
                    
                    ${data.notes ? `
                    <div class="alert alert-light mt-3">
                        <h6 class="mb-2">Notes:</h6>
                        <p class="mb-0">${data.notes}</p>
                    </div>
                    ` : ''}
                </div>
            `;
            
            modalContent.innerHTML = content;
            modal.show();
        })
        .catch(error => {
            console.error('Erreur:', error);
            showError('Impossible de charger les détails de la vaccination');
        });
}

/**
 * Affiche les détails d'un rappel
 */
function viewReminderDetails(reminderId) {
    fetch(`/api/postnatal/reminder/${reminderId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des détails du rappel');
            }
            return response.json();
        })
        .then(data => {
            // Afficher les détails dans une modale
            const modal = new bootstrap.Modal(document.getElementById('checkupDetailsModal'));
            const modalContent = document.getElementById('checkup-details-content');
            
            if (!modalContent) return;
            
            const reminderDate = new Date(data.reminder_date).toLocaleDateString('fr-FR');
            
            // Créer le contenu HTML pour les détails
            let content = `
                <div class="reminder-details">
                    <h5 class="text-primary mb-3">Détails du Rappel</h5>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p><strong>Titre:</strong> ${data.title}</p>
                            <p><strong>Date du rappel:</strong> ${reminderDate}</p>
                            <p><strong>Type:</strong> ${translateReminderType(data.reminder_type)}</p>
                            <p><strong>Priorité:</strong> <span class="badge bg-${getPriorityBadgeClass(data.priority)}">${translatePriority(data.priority)}</span></p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Statut:</strong> <span class="badge bg-${data.completed ? 'success' : 'warning'}">${data.completed ? 'Complété' : 'À venir'}</span></p>
                            ${data.patient_name ? `<p><strong>Patiente:</strong> ${data.patient_name}</p>` : ''}
                            ${data.baby_name ? `<p><strong>Bébé:</strong> ${data.baby_name}</p>` : ''}
                        </div>
                    </div>
                    
                    <div class="alert alert-info mt-3">
                        <h6 class="mb-2">Description:</h6>
                        <p class="mb-0">${data.description || 'Aucune description'}</p>
                    </div>
                    
                    ${!data.completed ? `
                    <div class="d-flex justify-content-end mt-3">
                        <button class="btn btn-success btn-sm complete-reminder-btn" data-reminder-id="${data.id}">
                            <i class="fas fa-check me-1"></i> Marquer comme complété
                        </button>
                    </div>
                    ` : ''}
                </div>
            `;
            
            modalContent.innerHTML = content;
            
            // Ajouter un gestionnaire d'événement pour le bouton de complétion
            const completeButton = modalContent.querySelector('.complete-reminder-btn');
            if (completeButton) {
                completeButton.addEventListener('click', function() {
                    completeReminder(data.id, modal);
                });
            }
            
            modal.show();
        })
        .catch(error => {
            console.error('Erreur:', error);
            showError('Impossible de charger les détails du rappel');
        });
}

/**
 * Marque un rappel comme complété
 */
function completeReminder(reminderId, modal) {
    fetch(`/api/postnatal/reminder/${reminderId}/complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour du rappel');
        }
        return response.json();
    })
    .then(data => {
        // Fermer la modale si fournie
        if (modal) modal.hide();
        
        // Afficher un message de succès
        showSuccess('Rappel marqué comme complété');
        
        // Recharger les rappels
        filterReminders();
        
        // Recharger les rappels à venir dans la sidebar
        loadReminders();
    })
    .catch(error => {
        console.error('Erreur:', error);
        showError('Erreur lors de la mise à jour du rappel');
    });
}

/**
 * Retourne la classe CSS pour le badge de priorité
 */
function getPriorityBadgeClass(priority) {
    switch (priority) {
        case 'high': return 'danger';
        case 'normal': return 'primary';
        case 'low': return 'secondary';
        default: return 'primary';
    }
}

/**
 * Gestionnaire de soumission du formulaire d'accouchement
 */
function handleDeliverySubmit() {
    submitDeliveryForm();
}

/**
 * Gestionnaire de soumission du formulaire d'examen mère
 */
function handleMotherCheckupSubmit() {
    submitMotherCheckupForm();
}

/**
 * Gestionnaire de soumission du formulaire d'examen bébé
 */
function handleBabyCheckupSubmit() {
    submitBabyCheckupForm();
}


// Ajouter des styles CSS personnalisés pour le module
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .postnatal-sidebar .nav-link {
            border-radius: 0;
            padding: 0.75rem 1rem;
        }
        
        .postnatal-sidebar .nav-link.active {
            background-color: #0d6efd;
        }
        
        .reminder-list .reminder-item {
            padding: 0.5rem 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .reminder-list .reminder-item:last-child {
            border-bottom: none;
        }
        
        .reminder-list .reminder-date {
            font-size: 0.8rem;
            color: #6c757d;
        }
        
        .reminder-list .reminder-title {
            font-weight: 500;
        }
        
        .reminder-list .reminder-badge {
            display: inline-block;
            font-size: 0.75rem;
            padding: 0.2rem 0.5rem;
            border-radius: 0.25rem;
        }
        
        .reminder-list .reminder-badge.high {
            background-color: #dc3545;
            color: white;
        }
        
        .reminder-list .reminder-badge.normal {
            background-color: #0d6efd;
            color: white;
        }
        
        .reminder-list .reminder-badge.low {
            background-color: #6c757d;
            color: white;
        }
        
        .protocol-steps ol li {
            margin-bottom: 0.5rem;
        }
        
        .recovery-item .progress {
            height: 8px;
        }
    `;
    
    document.head.appendChild(style);
});