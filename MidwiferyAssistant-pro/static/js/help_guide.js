/**
 * Système d'aide contextuelle et guide détaillé
 * 
 * Ce script gère l'affichage des guides d'aide détaillés pour chaque page
 * de l'application ANIPS-F.
 */

// Configuration des guides d'aide par page
const helpGuides = {
    // Page d'accueil/tableau de bord
    'dashboard': {
        title: "Guide du Tableau de Bord",
        description: "Le tableau de bord vous permet d'avoir une vue d'ensemble de vos activités et d'accéder rapidement aux fonctionnalités principales.",
        sections: [
            {
                title: "Cartes statistiques",
                content: "Les cartes en haut affichent des statistiques importantes: nombre de patientes suivies, mesures récentes, cycle par défaut et protocoles disponibles."
            },
            {
                title: "Accès rapide",
                content: "La section d'accès rapide vous permet d'accéder directement aux outils les plus utilisés comme le calculateur gestationnel, le suivi tensionnel, etc."
            },
            {
                title: "Activités récentes",
                content: "Cette section affiche les dernières mesures de tension artérielle enregistrées pour vos patientes, avec leur statut (normale, élevée, critique)."
            },
            {
                title: "Ressources utiles",
                content: "Des liens vers les ressources importantes comme les checklists adaptatives et le référentiel échographique."
            }
        ]
    },

    // Calculateur gestationnel
    'calculator': {
        title: "Guide du Calculateur Gestationnel",
        description: "Calculez précisément l'âge gestationnel et la date d'accouchement prévue en fonction des dernières règles.",
        sections: [
            {
                title: "Date des dernières règles",
                content: "Entrez la date des dernières règles de la patiente en utilisant le sélecteur de date."
            },
            {
                title: "Longueur du cycle",
                content: "Par défaut, un cycle de 28 jours est utilisé. Vous pouvez modifier cette valeur si la patiente a un cycle différent. Un cycle normal dure entre 21 et 35 jours."
            },
            {
                title: "Bouton Calculer",
                content: "Cliquez sur ce bouton pour effectuer le calcul de l'âge gestationnel et de la date prévue d'accouchement."
            },
            {
                title: "Résultats",
                content: "Les résultats affichent l'âge gestationnel actuel en semaines et jours, le terme prévu, le trimestre actuel et les recommandations spécifiques à cet âge gestationnel."
            }
        ]
    },

    // Checklists adaptatives
    'checklists': {
        title: "Guide des Checklists Adaptatives",
        description: "Accédez aux listes de contrôle spécifiques à chaque âge gestationnel pour un suivi optimal de la grossesse.",
        sections: [
            {
                title: "Sélecteur d'âge gestationnel",
                content: "Utilisez le curseur ou les boutons de trimestre pour sélectionner l'âge gestationnel souhaité (en semaines d'aménorrhée)."
            },
            {
                title: "Checklist générée",
                content: "La checklist affichée s'adapte automatiquement à l'âge gestationnel sélectionné, présentant les examens, vaccinations et conseils recommandés."
            },
            {
                title: "Aide-mémoire",
                content: "Le panneau latéral affiche un rappel des consultations recommandées et des échographies standard pendant la grossesse."
            }
        ]
    },

    // Analyse biomédicale
    'biomedical': {
        title: "Guide de l'Analyse Biomédicale",
        description: "Interprétez les résultats d'analyses sanguines et obtenez des recommandations cliniques adaptées à la grossesse.",
        sections: [
            {
                title: "Saisie des résultats",
                content: "Entrez les valeurs des différents paramètres sanguins: hémoglobine, plaquettes, ferritine, etc. Les champs marqués (optionnel) ne sont pas obligatoires mais améliorent la précision de l'interprétation."
            },
            {
                title: "Sélection de patiente",
                content: "Si vous souhaitez associer ces résultats à une patiente existante, sélectionnez-la dans la liste déroulante."
            },
            {
                title: "Bouton Analyser",
                content: "Cliquez sur ce bouton pour obtenir une interprétation clinique des valeurs saisies, avec des recommandations adaptées à la grossesse."
            },
            {
                title: "Valeurs de référence",
                content: "En bas de page, vous trouverez un tableau des valeurs normales pendant la grossesse et les seuils d'alerte pour référence rapide."
            }
        ]
    },

    // Suivi tensionnel
    'blood_pressure': {
        title: "Guide du Suivi Tensionnel",
        description: "Surveillez et analysez la tension artérielle avec détection de la pré-éclampsie et suivi dans le temps.",
        sections: [
            {
                title: "Saisie des mesures",
                content: "Entrez les valeurs de tension systolique, diastolique et la fréquence cardiaque (optionnelle). Vous pouvez ajouter des notes contextuelles si nécessaire."
            },
            {
                title: "Sélection de patiente",
                content: "Pour enregistrer la mesure dans le dossier d'une patiente, sélectionnez-la dans la liste déroulante."
            },
            {
                title: "Bouton Évaluer",
                content: "Cliquez pour analyser les valeurs et obtenir une classification de la tension artérielle avec des recommandations de suivi."
            },
            {
                title: "Historique graphique",
                content: "Si une patiente est sélectionnée et a des mesures précédentes, un graphique d'évolution sera affiché pour visualiser les tendances."
            },
            {
                title: "Valeurs de référence",
                content: "Le tableau en bas affiche les classifications de tension (normale, élevée, HTA) avec les valeurs seuils et conduites à tenir recommandées."
            }
        ]
    },

    // Référentiel échographique
    'ultrasound': {
        title: "Guide du Référentiel Échographique",
        description: "Consultez les références pour l'interprétation des échographies obstétricales et analysez les mesures biométriques fœtales.",
        sections: [
            {
                title: "Âge gestationnel",
                content: "Sélectionnez l'âge gestationnel en semaines d'aménorrhée pour afficher les valeurs de référence correspondantes."
            },
            {
                title: "Mesures biométriques",
                content: "Entrez les mesures du BPD (diamètre bipariétal), HC (périmètre crânien), AC (périmètre abdominal) et FL (longueur fémorale). Les valeurs normales de référence s'affichent automatiquement à droite de chaque champ."
            },
            {
                title: "Liquide amniotique et placenta",
                content: "Documentez l'index de liquide amniotique et la localisation placentaire pour une évaluation complète."
            },
            {
                title: "Analyse des mesures",
                content: "Le bouton 'Analyser les mesures' évalue les valeurs saisies par rapport aux références et calcule le poids fœtal estimé."
            },
            {
                title: "Courbes de croissance",
                content: "Visualisez les courbes de croissance fœtale avec percentiles. Vous pouvez basculer entre différentes mesures (poids estimé, BPD, HC, AC, FL) avec les boutons sous le graphique."
            }
        ]
    },

    // Protocoles d'urgence
    'emergency': {
        title: "Guide des Protocoles d'Urgence",
        description: "Accédez rapidement aux protocoles de prise en charge des urgences obstétricales.",
        sections: [
            {
                title: "Recherche de protocole",
                content: "Utilisez la barre de recherche pour trouver rapidement un protocole spécifique (hémorragie, éclampsie, etc.)."
            },
            {
                title: "Liste des protocoles",
                content: "Les protocoles sont organisés par niveau de gravité avec un code couleur. Cliquez sur un protocole pour l'ouvrir."
            },
            {
                title: "Détail du protocole",
                content: "Chaque protocole présente les signes cliniques, les actions immédiates à entreprendre, et les étapes de prise en charge."
            },
            {
                title: "Numéros d'urgence",
                content: "En bas de page, vous trouverez les numéros d'urgence nationaux et la possibilité d'ajouter vos contacts locaux personnalisés."
            }
        ]
    },

    // Gestion des patientes
    'patients': {
        title: "Guide de Gestion des Patientes",
        description: "Gérez votre liste de patientes et accédez à leurs informations cliniques.",
        sections: [
            {
                title: "Liste des patientes",
                content: "Visualisez toutes vos patientes avec leurs informations principales (nom, date de naissance, DDR, âge gestationnel actuel)."
            },
            {
                title: "Recherche",
                content: "Utilisez le champ de recherche pour filtrer rapidement la liste par nom ou prénom."
            },
            {
                title: "Ajout de patiente",
                content: "Cliquez sur 'Nouvelle patiente' pour ouvrir le formulaire d'ajout. Les champs marqués d'un astérisque (*) sont obligatoires."
            },
            {
                title: "Actions sur les patientes",
                content: "Pour chaque patiente, vous pouvez utiliser les boutons d'action pour voir le détail, modifier les informations ou supprimer la patiente (avec confirmation)."
            }
        ]
    },

    // Profil utilisateur
    'profile': {
        title: "Guide du Profil Utilisateur",
        description: "Gérez vos informations personnelles et paramètres de l'application.",
        sections: [
            {
                title: "Informations du compte",
                content: "Visualisez et modifiez vos informations de base (nom d'utilisateur, email)."
            },
            {
                title: "Paramètres du profil",
                content: "Personnalisez vos préférences, notamment la longueur de cycle par défaut utilisée dans les calculs gestationnels."
            },
            {
                title: "Changement de mot de passe",
                content: "Modifiez votre mot de passe en fournissant l'ancien et le nouveau. Un indicateur de force du mot de passe vous guide pour créer un mot de passe sécurisé."
            },
            {
                title: "Journal d'activité",
                content: "Consultez l'historique de vos connexions et actions importantes dans l'application pour des raisons de sécurité et traçabilité."
            }
        ]
    },

    // Login
    'login': {
        title: "Guide de Connexion",
        description: "Connectez-vous à votre compte ANIPS-F.",
        sections: [
            {
                title: "Identifiants",
                content: "Entrez votre nom d'utilisateur et mot de passe dans les champs correspondants."
            },
            {
                title: "Se souvenir de moi",
                content: "Cochez cette option pour rester connecté sur cet appareil (déconseillé sur un ordinateur partagé)."
            },
            {
                title: "Création de compte",
                content: "Si vous n'avez pas encore de compte, cliquez sur 'Créer un compte' en bas de page."
            }
        ]
    },

    // Register
    'register': {
        title: "Guide d'Inscription",
        description: "Créez un nouveau compte pour accéder à ANIPS-F.",
        sections: [
            {
                title: "Informations requises",
                content: "Remplissez tous les champs obligatoires: nom d'utilisateur, email, mot de passe et confirmation du mot de passe."
            },
            {
                title: "Sécurité du mot de passe",
                content: "Créez un mot de passe fort contenant au moins 8 caractères, des majuscules, minuscules, chiffres et caractères spéciaux. Un indicateur vous montre la force de votre mot de passe."
            },
            {
                title: "Compte existant",
                content: "Si vous avez déjà un compte, cliquez sur 'Se connecter' en bas de page."
            }
        ]
    }
};

// Fonction pour afficher le guide d'aide contextuel
function showHelpGuide(pageId) {
    // Si le guide n'existe pas pour cette page, utiliser un message générique
    const guide = helpGuides[pageId] || {
        title: "Aide générale ANIPS-F",
        description: "ANIPS-F est une application médicale pour sages-femmes centralisant les outils cliniques.",
        sections: [
            {
                title: "Navigation",
                content: "Utilisez le menu principal pour accéder aux différentes fonctionnalités de l'application."
            }
        ]
    };
    
    // Créer la modal d'aide
    let modalHTML = `
    <div class="modal fade" id="helpGuideModal" tabindex="-1" role="dialog" aria-labelledby="helpGuideModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-info text-white">
                    <h5 class="modal-title" id="helpGuideModalLabel"><i class="fas fa-question-circle"></i> ${guide.title}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="lead">${guide.description}</p>
                    <hr>
                    <div class="help-guide-content">
    `;
    
    // Ajouter chaque section
    guide.sections.forEach(section => {
        modalHTML += `
        <div class="help-guide-section mb-4">
            <h4><i class="fas fa-info-circle text-info"></i> ${section.title}</h4>
            <p>${section.content}</p>
        </div>
        `;
    });
    
    // Fermer la modal
    modalHTML += `
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Fermer</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Supprimer une modal existante si présente
    const existingModal = document.getElementById('helpGuideModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Ajouter la modal au body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Afficher la modal
    $('#helpGuideModal').modal('show');
}

// Au chargement du document, ajouter le bouton d'aide à la navbar
document.addEventListener('DOMContentLoaded', function() {
    // Déterminer la page actuelle
    const path = window.location.pathname;
    let currentPage = 'dashboard'; // Par défaut
    
    // Extraire l'ID de la page à partir du chemin
    if (path.includes('/login')) {
        currentPage = 'login';
    } else if (path.includes('/register')) {
        currentPage = 'register';
    } else if (path.includes('/dashboard')) {
        currentPage = 'dashboard';
    } else if (path.includes('/calculator')) {
        currentPage = 'calculator';
    } else if (path.includes('/checklists')) {
        currentPage = 'checklists';
    } else if (path.includes('/biomedical')) {
        currentPage = 'biomedical';
    } else if (path.includes('/blood_pressure')) {
        currentPage = 'blood_pressure';
    } else if (path.includes('/ultrasound')) {
        currentPage = 'ultrasound';
    } else if (path.includes('/emergency')) {
        currentPage = 'emergency';
    } else if (path.includes('/patients')) {
        currentPage = 'patients';
    } else if (path.includes('/profile')) {
        currentPage = 'profile';
    }
    
    // Ajouter le bouton d'aide à la navbar si connecté
    const navbar = document.querySelector('.navbar-nav.mr-auto');
    if (navbar) {
        const helpButton = document.createElement('li');
        helpButton.className = 'nav-item';
        helpButton.innerHTML = `
            <a class="nav-link" href="#" id="showHelpGuide">
                <i class="fas fa-question-circle"></i> Aide
            </a>
        `;
        navbar.appendChild(helpButton);
        
        // Ajouter l'événement de clic
        document.getElementById('showHelpGuide').addEventListener('click', function(e) {
            e.preventDefault();
            showHelpGuide(currentPage);
        });
    }
    
    // Ajouter le bouton d'aide flottant (visible même sur les pages de login/register)
    const helpFloating = document.createElement('div');
    helpFloating.className = 'help-floating';
    helpFloating.innerHTML = `
        <button class="btn btn-info rounded-circle" id="floatingHelpBtn" title="Aide contextuelle">
            <i class="fas fa-question"></i>
        </button>
    `;
    document.body.appendChild(helpFloating);
    
    // Ajouter le style pour le bouton flottant
    const style = document.createElement('style');
    style.textContent = `
        .help-floating {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
        }
        .help-floating button {
            width: 50px;
            height: 50px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .help-guide-section h4 {
            color: #1a73e8;
            font-size: 1.2rem;
            margin-bottom: 0.5rem;
        }
    `;
    document.head.appendChild(style);
    
    // Ajouter l'événement de clic au bouton flottant
    document.getElementById('floatingHelpBtn').addEventListener('click', function() {
        showHelpGuide(currentPage);
    });
});