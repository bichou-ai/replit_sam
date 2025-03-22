from datetime import datetime, timedelta

def calculate_gestational_age(last_period, cycle_length=28):
    """
    Calculate gestational age based on last menstrual period and cycle length.
    
    Args:
        last_period (datetime): Date of last menstrual period
        cycle_length (int): Length of menstrual cycle in days
    
    Returns:
        tuple: (weeks, days) of gestational age
    """
    today = datetime.now()
    
    # Adjust for longer or shorter cycles
    cycle_adjustment = cycle_length - 28
    adjusted_last_period = last_period - timedelta(days=cycle_adjustment)
    
    # Calculate difference
    difference = today - adjusted_last_period
    total_days = difference.days
    
    # Calculate weeks and remaining days
    weeks = total_days // 7
    days = total_days % 7
    
    return weeks, days

def get_gestational_age_recommendations(weeks):
    """
    Get clinical recommendations based on gestational age in weeks.
    
    Args:
        weeks (int): Gestational age in weeks
    
    Returns:
        dict: Recommendations including examinations, tests and follow-up
    """
    recommendations = {
        'examinations': [],
        'tests': [],
        'followUp': [],
        'warning': None
    }
    
    # First trimester
    if weeks < 14:
        recommendations['examinations'] = [
            "Examen clinique complet", 
            "Prise de tension artérielle",
            "Mesure du poids et calcul de l'IMC"
        ]
        recommendations['tests'] = [
            "Groupe sanguin et Rhésus (si non connu)",
            "Sérologie toxoplasmose (si non immune)",
            "Glycémie à jeun",
            "Sérologies (rubéole, VIH, VHC, VHB, syphilis)"
        ]
        recommendations['followUp'] = [
            "Première échographie (datation) entre 11 et 13 SA + 6 jours",
            "Entretien prénatal précoce",
            "Prescription acide folique 0,4 mg/jour"
        ]
    
    # Second trimester
    elif weeks < 28:
        recommendations['examinations'] = [
            "Examen clinique et obstétrical",
            "Prise de tension artérielle",
            "Mesure du poids",
            "Recherche de protéinurie"
        ]
        
        if weeks >= 24:
            recommendations['examinations'].append("Mesure de la hauteur utérine")
        
        if weeks < 18:
            recommendations['tests'] = [
                "Sérologie toxoplasmose mensuelle (si non immune)",
                "Dépistage T21 jusqu'à 13 SA + 6 jours"
            ]
        elif weeks < 24:
            recommendations['tests'] = [
                "Sérologie toxoplasmose mensuelle (si non immune)",
                "Glycosurie et protéinurie"
            ]
        else:
            recommendations['tests'] = [
                "Sérologie toxoplasmose mensuelle (si non immune)",
                "O'Sullivan entre 24 et 28 SA",
                "NFS, ferritinémie"
            ]
        
        if 20 <= weeks < 25:
            recommendations['followUp'].append("Deuxième échographie (morphologique) entre 20 et 25 SA")
    
    # Third trimester
    else:
        recommendations['examinations'] = [
            "Examen clinique et obstétrical",
            "Prise de tension artérielle",
            "Mesure du poids",
            "Mesure de la hauteur utérine",
            "Recherche de protéinurie",
            "Surveillance mouvements actifs fœtaux"
        ]
        recommendations['tests'] = [
            "Sérologie toxoplasmose mensuelle (si non immune)",
            "Recherche Streptocoque B entre 35 et 38 SA"
        ]
        
        if weeks >= 30 and weeks < 35:
            recommendations['followUp'].append("Troisième échographie (croissance) entre 30 et 35 SA")
        
        if weeks >= 37:
            recommendations['warning'] = "Grossesse à terme"
            recommendations['followUp'].append("Consultation en urgence si rupture des membranes, contractions, diminution des mouvements actifs fœtaux")
    
    return recommendations

def analyze_blood_results(hemoglobin, platelets, ferritin=None, hematocrit=None, ldh=None, alt=None, ast=None):
    """
    Analyze and interpret blood test results for pregnant women.
    
    Args:
        hemoglobin (float): Hemoglobin level in g/dL
        platelets (int): Platelet count in 10^9/L
        ferritin (float, optional): Ferritin level in μg/L
        hematocrit (float, optional): Hematocrit percentage
        ldh (float, optional): Lactate dehydrogenase in U/L
        alt (float, optional): Alanine aminotransferase in U/L
        ast (float, optional): Aspartate aminotransferase in U/L
    
    Returns:
        dict: Analysis and recommendations
    """
    analysis = {
        'hemoglobin': {
            'value': hemoglobin,
            'status': 'normal',
            'message': 'Taux d\'hémoglobine normal'
        },
        'platelets': {
            'value': platelets,
            'status': 'normal',
            'message': 'Taux de plaquettes normal'
        },
        'overall': {
            'status': 'normal',
            'message': 'Résultats dans les normes',
            'recommendations': []
        }
    }
    
    # Analyze hemoglobin
    if hemoglobin < 8:
        analysis['hemoglobin']['status'] = 'critical'
        analysis['hemoglobin']['message'] = 'Anémie sévère'
        analysis['overall']['recommendations'].append('Fer intraveineux recommandé')
        analysis['overall']['status'] = 'critical'
    elif hemoglobin < 10:
        analysis['hemoglobin']['status'] = 'warning'
        analysis['hemoglobin']['message'] = 'Anémie modérée'
        analysis['overall']['recommendations'].append('Supplément en fer oral (80-100 mg/jour)')
        analysis['overall']['status'] = 'warning'
    elif hemoglobin < 11:
        analysis['hemoglobin']['status'] = 'mild'
        analysis['hemoglobin']['message'] = 'Anémie légère'
        analysis['overall']['recommendations'].append('Supplément en fer oral (30-60 mg/jour)')
        analysis['overall']['status'] = 'mild'
    
    # Analyze platelets
    if platelets < 50:
        analysis['platelets']['status'] = 'critical'
        analysis['platelets']['message'] = 'Thrombopénie sévère'
        analysis['overall']['recommendations'].append('Consultation hématologique urgente')
        analysis['overall']['status'] = 'critical'
    elif platelets < 100:
        analysis['platelets']['status'] = 'warning'
        analysis['platelets']['message'] = 'Thrombopénie modérée'
        analysis['overall']['recommendations'].append('Surveillance rapprochée, LDH et frottis sanguin')
        analysis['overall']['status'] = 'warning'
    elif platelets < 150:
        analysis['platelets']['status'] = 'mild'
        analysis['platelets']['message'] = 'Thrombopénie légère'
        analysis['overall']['recommendations'].append('Surveillance à la prochaine consultation')
        
    # Add ferritin analysis if provided
    if ferritin is not None:
        analysis['ferritin'] = {
            'value': ferritin,
            'status': 'normal',
            'message': 'Taux de ferritine normal'
        }
        
        if ferritin < 15:
            analysis['ferritin']['status'] = 'warning'
            analysis['ferritin']['message'] = 'Déplétion des réserves en fer'
            analysis['overall']['recommendations'].append('Supplément en fer oral')
            if analysis['overall']['status'] == 'normal':
                analysis['overall']['status'] = 'mild'
        elif ferritin < 30:
            analysis['ferritin']['status'] = 'mild'
            analysis['ferritin']['message'] = 'Réserves en fer faibles'
            analysis['overall']['recommendations'].append('Considérer un supplément en fer oral')
    
    # Check for HELLP syndrome markers
    hellp_indicators = 0
    
    if platelets < 100:
        hellp_indicators += 1
    
    if ldh is not None:
        analysis['ldh'] = {
            'value': ldh,
            'status': 'normal',
            'message': 'LDH normal'
        }
        
        if ldh > 600:
            analysis['ldh']['status'] = 'critical'
            analysis['ldh']['message'] = 'LDH élevé'
            hellp_indicators += 1
    
    if ast is not None and alt is not None:
        analysis['liver_enzymes'] = {
            'ast': ast,
            'alt': alt,
            'status': 'normal',
            'message': 'Enzymes hépatiques normales'
        }
        
        if ast > 70 or alt > 70:
            analysis['liver_enzymes']['status'] = 'critical'
            analysis['liver_enzymes']['message'] = 'Enzymes hépatiques élevées'
            hellp_indicators += 1
    
    # Check for HELLP syndrome
    if hellp_indicators >= 2:
        analysis['overall']['status'] = 'critical'
        analysis['overall']['message'] = 'Suspicion de syndrome HELLP'
        analysis['overall']['recommendations'] = [
            'Consultation obstétricale immédiate',
            'Tension artérielle et protéinurie',
            'Surveillance fœtale'
        ]
    
    # Set the overall message based on status if not already set
    if analysis['overall']['status'] != 'normal' and analysis['overall']['message'] == 'Résultats dans les normes':
        if analysis['overall']['status'] == 'mild':
            analysis['overall']['message'] = 'Anomalies légères détectées'
        elif analysis['overall']['status'] == 'warning':
            analysis['overall']['message'] = 'Anomalies modérées détectées'
        elif analysis['overall']['status'] == 'critical':
            analysis['overall']['message'] = 'Anomalies critiques détectées'
    
    return analysis

def evaluate_blood_pressure(systolic, diastolic):
    """
    Evaluate blood pressure and classify it according to hypertension guidelines for pregnant women.
    
    Args:
        systolic (int): Systolic blood pressure in mmHg
        diastolic (int): Diastolic blood pressure in mmHg
    
    Returns:
        dict: Evaluation and recommendations
    """
    result = {
        'systolic': systolic,
        'diastolic': diastolic,
        'status': 'normal',
        'message': 'Tension artérielle normale',
        'recommendations': []
    }
    
    # Critical hypertension (severe)
    if systolic >= 160 or diastolic >= 110:
        result['status'] = 'critical'
        result['message'] = 'CRISE HYPERTENSIVE → URGENCE'
        result['recommendations'] = [
            'Transfert immédiat en milieu hospitalier',
            'Bilan prééclampsie complet',
            'Surveillance fœtale',
            'Traitement antihypertenseur parentéral à envisager'
        ]
    
    # Moderate hypertension
    elif (systolic >= 150 and systolic < 160) or (diastolic >= 100 and diastolic < 110):
        result['status'] = 'warning'
        result['message'] = 'HTA modérée → Contrôle rapide'
        result['recommendations'] = [
            'Contrôle dans la journée',
            'Recherche de protéinurie',
            'Surveillance des signes fonctionnels de prééclampsie',
            'Consultation obstétricale si persistance'
        ]
    
    # Mild hypertension
    elif (systolic >= 140 and systolic < 150) or (diastolic >= 90 and diastolic < 100):
        result['status'] = 'mild'
        result['message'] = 'HTA légère → Surveillance'
        result['recommendations'] = [
            'Contrôle dans les 24h',
            'Repos et position latérale gauche',
            'Recherche de protéinurie'
        ]
    
    # Elevated (borderline)
    elif (systolic >= 130 and systolic < 140) or (diastolic >= 80 and diastolic < 90):
        result['status'] = 'elevated'
        result['message'] = 'Tension artérielle élevée'
        result['recommendations'] = [
            'Surveillance à la prochaine consultation',
            'Conseils hygiéno-diététiques (limiter sel, repos)',
            'Auto-surveillance si possible'
        ]
    
    # Low blood pressure
    elif systolic < 90 or diastolic < 60:
        result['status'] = 'low'
        result['message'] = 'Tension artérielle basse'
        result['recommendations'] = [
            'Hydratation suffisante',
            'Position latérale gauche en cas de malaise',
            'Lever progressif'
        ]
    
    return result

def get_ultrasound_reference_data():
    """
    Get reference data for ultrasound measurements by gestational age.
    
    Returns:
        dict: Dictionary with reference values by week
    """
    # Reference data for ultrasound measurements by gestational age (weeks)
    # Values are in the format: {measurement: [mean, -2SD, +2SD]}
    return {
        12: {
            'bpd': [21.9, 19.0, 24.8], 
            'hc': [78.8, 69.3, 88.3], 
            'ac': [63.4, 53.4, 73.4],
            'fl': [8.6, 5.9, 11.3]
        },
        13: {
            'bpd': [25.2, 22.3, 28.1], 
            'hc': [91.3, 81.8, 100.8], 
            'ac': [74.1, 64.1, 84.1],
            'fl': [11.2, 8.5, 13.9]
        },
        14: {
            'bpd': [28.5, 25.6, 31.4], 
            'hc': [103.8, 94.3, 113.3], 
            'ac': [84.8, 74.8, 94.8],
            'fl': [13.8, 11.1, 16.5]
        },
        15: {
            'bpd': [31.8, 28.9, 34.7], 
            'hc': [116.3, 106.8, 125.8], 
            'ac': [95.5, 85.5, 105.5],
            'fl': [16.4, 13.7, 19.1]
        },
        16: {
            'bpd': [35.1, 32.2, 38.0], 
            'hc': [128.8, 119.3, 138.3], 
            'ac': [106.2, 96.2, 116.2],
            'fl': [19.0, 16.3, 21.7]
        },
        17: {
            'bpd': [38.4, 35.5, 41.3], 
            'hc': [141.3, 131.8, 150.8], 
            'ac': [116.9, 106.9, 126.9],
            'fl': [21.6, 18.9, 24.3]
        },
        18: {
            'bpd': [41.7, 38.8, 44.6], 
            'hc': [153.8, 144.3, 163.3], 
            'ac': [127.6, 117.6, 137.6],
            'fl': [24.2, 21.5, 26.9]
        },
        19: {
            'bpd': [45.0, 42.1, 47.9], 
            'hc': [166.3, 156.8, 175.8], 
            'ac': [138.3, 128.3, 148.3],
            'fl': [26.8, 24.1, 29.5]
        },
        20: {
            'bpd': [48.3, 45.4, 51.2], 
            'hc': [178.8, 169.3, 188.3], 
            'ac': [149.0, 139.0, 159.0],
            'fl': [29.4, 26.7, 32.1]
        },
        21: {
            'bpd': [51.6, 48.7, 54.5], 
            'hc': [191.3, 181.8, 200.8], 
            'ac': [159.7, 149.7, 169.7],
            'fl': [32.0, 29.3, 34.7]
        },
        22: {
            'bpd': [54.9, 52.0, 57.8], 
            'hc': [203.8, 194.3, 213.3], 
            'ac': [170.4, 160.4, 180.4],
            'fl': [34.6, 31.9, 37.3]
        },
        23: {
            'bpd': [58.2, 55.3, 61.1], 
            'hc': [216.3, 206.8, 225.8], 
            'ac': [181.1, 171.1, 191.1],
            'fl': [37.2, 34.5, 39.9]
        },
        24: {
            'bpd': [61.5, 58.6, 64.4], 
            'hc': [228.8, 219.3, 238.3], 
            'ac': [191.8, 181.8, 201.8],
            'fl': [39.8, 37.1, 42.5]
        },
        25: {
            'bpd': [64.8, 61.9, 67.7], 
            'hc': [241.3, 231.8, 250.8], 
            'ac': [202.5, 192.5, 212.5],
            'fl': [42.4, 39.7, 45.1]
        },
        26: {
            'bpd': [68.1, 65.2, 71.0], 
            'hc': [253.8, 244.3, 263.3], 
            'ac': [213.2, 203.2, 223.2],
            'fl': [45.0, 42.3, 47.7]
        },
        27: {
            'bpd': [71.4, 68.5, 74.3], 
            'hc': [266.3, 256.8, 275.8], 
            'ac': [223.9, 213.9, 233.9],
            'fl': [47.6, 44.9, 50.3]
        },
        28: {
            'bpd': [74.7, 71.8, 77.6], 
            'hc': [278.8, 269.3, 288.3], 
            'ac': [234.6, 224.6, 244.6],
            'fl': [50.2, 47.5, 52.9]
        },
        29: {
            'bpd': [78.0, 75.1, 80.9], 
            'hc': [291.3, 281.8, 300.8], 
            'ac': [245.3, 235.3, 255.3],
            'fl': [52.8, 50.1, 55.5]
        },
        30: {
            'bpd': [81.3, 78.4, 84.2], 
            'hc': [303.8, 294.3, 313.3], 
            'ac': [256.0, 246.0, 266.0],
            'fl': [55.4, 52.7, 58.1]
        },
        31: {
            'bpd': [84.6, 81.7, 87.5], 
            'hc': [316.3, 306.8, 325.8], 
            'ac': [266.7, 256.7, 276.7],
            'fl': [58.0, 55.3, 60.7]
        },
        32: {
            'bpd': [87.9, 85.0, 90.8], 
            'hc': [328.8, 319.3, 338.3], 
            'ac': [277.4, 267.4, 287.4],
            'fl': [60.6, 57.9, 63.3]
        },
        33: {
            'bpd': [91.2, 88.3, 94.1], 
            'hc': [341.3, 331.8, 350.8], 
            'ac': [288.1, 278.1, 298.1],
            'fl': [63.2, 60.5, 65.9]
        },
        34: {
            'bpd': [94.5, 91.6, 97.4], 
            'hc': [353.8, 344.3, 363.3], 
            'ac': [298.8, 288.8, 308.8],
            'fl': [65.8, 63.1, 68.5]
        },
        35: {
            'bpd': [97.8, 94.9, 100.7], 
            'hc': [366.3, 356.8, 375.8], 
            'ac': [309.5, 299.5, 319.5],
            'fl': [68.4, 65.7, 71.1]
        },
        36: {
            'bpd': [101.1, 98.2, 104.0], 
            'hc': [378.8, 369.3, 388.3], 
            'ac': [320.2, 310.2, 330.2],
            'fl': [71.0, 68.3, 73.7]
        },
        37: {
            'bpd': [104.4, 101.5, 107.3], 
            'hc': [391.3, 381.8, 400.8], 
            'ac': [330.9, 320.9, 340.9],
            'fl': [73.6, 70.9, 76.3]
        },
        38: {
            'bpd': [107.7, 104.8, 110.6], 
            'hc': [403.8, 394.3, 413.3], 
            'ac': [341.6, 331.6, 351.6],
            'fl': [76.2, 73.5, 78.9]
        },
        39: {
            'bpd': [111.0, 108.1, 113.9], 
            'hc': [416.3, 406.8, 425.8], 
            'ac': [352.3, 342.3, 362.3],
            'fl': [78.8, 76.1, 81.5]
        },
        40: {
            'bpd': [114.3, 111.4, 117.2], 
            'hc': [428.8, 419.3, 438.3], 
            'ac': [363.0, 353.0, 373.0],
            'fl': [81.4, 78.7, 84.1]
        }
    }

def get_emergency_protocols():
    """
    Get emergency obstetrical protocols.
    
    Returns:
        dict: Dictionary with emergency protocols
    """
    return {
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
    }
