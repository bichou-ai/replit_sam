/**
 * Assistant IA pour la prise de décision médicale
 * 
 * Ce script gère l'intégration avec des modèles d'IA comme ChatGPT/OpenAI ou Gemini
 * pour fournir une aide à la décision médicale dans l'application ANIPS-F.
 */

// Configuration de l'assistant IA
const aiAssistantConfig = {
    // API à utiliser ('openai' ou 'gemini')
    defaultProvider: 'openai',
    
    // Texte de présentation de l'assistant
    welcomeMessage: "Bonjour, je suis l'Assistant IA d'ANIPS-F. Je peux vous aider à interpréter des résultats, " +
                    "à réfléchir à des situations cliniques ou à obtenir des informations médicales basées sur " +
                    "les recommandations actuelles en obstétrique.",
    
    // Instructions sur l'utilisation
    instructionsMessage: "Pour me consulter, décrivez votre question médicale ou la situation clinique que vous souhaitez analyser.",
    
    // Modèle à utiliser pour OpenAI (par défaut)
    openaiModel: "gpt-4",
    
    // Templates de prompts par type de consultation
    promptTemplates: {
        general: 
            "En tant qu'assistant d'aide à la décision médicale pour les sages-femmes, " +
            "basez votre réponse sur les données scientifiques les plus récentes et les recommandations obstétricales actuelles. " +
            "Question: {query}",
        
        bloodPressure: 
            "En tant qu'assistant d'aide à la décision médicale pour les sages-femmes, " +
            "analysez ces mesures de tension artérielle chez une femme enceinte: " +
            "Systolique: {systolic} mmHg, Diastolique: {diastolic} mmHg, " +
            "Fréquence cardiaque: {heartRate} bpm. " +
            "Âge gestationnel: {gestationalAge} SA. " +
            "Utilisez les recommandations obstétricales actuelles pour votre analyse et suggérez une conduite à tenir.",
        
        biomedical: 
            "En tant qu'assistant d'aide à la décision médicale pour les sages-femmes, " +
            "interprétez ces résultats d'analyses sanguines chez une femme enceinte: " +
            "Hémoglobine: {hemoglobin} g/dL, " +
            "Plaquettes: {platelets} 10^9/L, " +
            "Ferritine: {ferritin} μg/L, " +
            "Hématocrite: {hematocrit}%, " +
            "LDH: {ldh} U/L, " +
            "ALT/SGPT: {alt} U/L, " +
            "AST/SGOT: {ast} U/L. " +
            "Âge gestationnel: {gestationalAge} SA. " +
            "Basez votre interprétation sur les normes obstétricales actuelles et suggérez des actions.",
        
        ultrasound: 
            "En tant qu'assistant d'aide à la décision médicale pour les sages-femmes, " +
            "analysez ces mesures échographiques fœtales: " +
            "Âge gestationnel: {gestationalAge} SA, " +
            "BPD: {bpd} mm, " +
            "HC: {hc} mm, " +
            "AC: {ac} mm, " +
            "FL: {fl} mm, " +
            "Poids estimé: {efw} g, " +
            "Liquide amniotique: {afi} cm, " +
            "Placenta: {placenta}. " +
            "Évaluez si ces mesures sont dans les normes pour cet âge gestationnel et suggérez des actions si nécessaire."
    }
};

// Classe pour gérer l'assistant IA
class AIAssistant {
    constructor(config = aiAssistantConfig) {
        this.config = config;
        this.currentProvider = config.defaultProvider;
        this.apiKey = null;
        this.container = null;
        this.initialized = false;
    }
    
    // Initialiser l'assistant sur une page
    initialize(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('Container pour l\'assistant IA non trouvé:', containerSelector);
            return false;
        }
        
        this.createAssistantUI();
        this.attachEventListeners();
        this.initialized = true;
        return true;
    }
    
    // Créer l'interface utilisateur de l'assistant
    createAssistantUI() {
        // Créer le style CSS pour l'assistant
        const style = document.createElement('style');
        style.textContent = `
            .ai-assistant-container {
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                overflow: hidden;
                background-color: #f9f9f9;
                margin-bottom: 20px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            .ai-assistant-header {
                background-color: #1a73e8;
                color: white;
                padding: 12px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .ai-assistant-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 500;
                display: flex;
                align-items: center;
            }
            
            .ai-assistant-header h3 i {
                margin-right: 8px;
            }
            
            .ai-assistant-body {
                padding: 15px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .ai-assistant-welcome {
                margin-bottom: 15px;
            }
            
            .ai-assistant-chat {
                margin-bottom: 15px;
                max-height: 200px;
                overflow-y: auto;
                border: 1px solid #e0e0e0;
                border-radius: 5px;
                padding: 10px;
                background-color: white;
            }
            
            .ai-message, .user-message {
                margin-bottom: 10px;
                padding: 8px 12px;
                border-radius: 18px;
                max-width: 80%;
            }
            
            .ai-message {
                background-color: #e3f2fd;
                margin-right: auto;
                border-bottom-left-radius: 5px;
            }
            
            .user-message {
                background-color: #e8f5e9;
                margin-left: auto;
                border-bottom-right-radius: 5px;
                text-align: right;
            }
            
            .ai-assistant-input {
                display: flex;
                margin-top: 10px;
            }
            
            .ai-assistant-input textarea {
                flex-grow: 1;
                border: 1px solid #e0e0e0;
                border-radius: 5px;
                padding: 8px 12px;
                resize: none;
                height: 40px;
                margin-right: 8px;
            }
            
            .ai-assistant-input button {
                background-color: #1a73e8;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 8px 15px;
                cursor: pointer;
            }
            
            .ai-assistant-input button:hover {
                background-color: #1565c0;
            }
            
            .ai-assistant-input button:disabled {
                background-color: #b0bec5;
                cursor: not-allowed;
            }
            
            .ai-typing {
                padding: 8px 12px;
                border-radius: 18px;
                background-color: #e3f2fd;
                margin-right: auto;
                margin-bottom: 10px;
                border-bottom-left-radius: 5px;
                max-width: 80%;
                display: flex;
                align-items: center;
            }
            
            .ai-typing .typing-indicator {
                display: flex;
            }
            
            .ai-typing .typing-indicator span {
                height: 8px;
                width: 8px;
                border-radius: 50%;
                background-color: #90caf9;
                margin: 0 1px;
                animation: typing 1s infinite ease-in-out;
            }
            
            .ai-typing .typing-indicator span:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .ai-typing .typing-indicator span:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes typing {
                0% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
                100% { transform: translateY(0); }
            }
            
            .ai-assistant-settings {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #e0e0e0;
            }
            
            .api-key-input {
                width: 100%;
                padding: 8px;
                margin-top: 5px;
                border: 1px solid #e0e0e0;
                border-radius: 5px;
            }
            
            .ai-assistant-footer {
                background-color: #f5f5f5;
                padding: 8px 15px;
                font-size: 12px;
                color: #757575;
                text-align: center;
                border-top: 1px solid #e0e0e0;
            }
            
            .provider-selector {
                display: flex;
                margin-bottom: 10px;
            }
            
            .provider-option {
                flex: 1;
                text-align: center;
                padding: 8px;
                cursor: pointer;
                border: 1px solid #e0e0e0;
                background-color: #f5f5f5;
            }
            
            .provider-option.selected {
                background-color: #e3f2fd;
                border-color: #1a73e8;
                font-weight: bold;
            }
            
            .provider-option:first-child {
                border-radius: 5px 0 0 5px;
            }
            
            .provider-option:last-child {
                border-radius: 0 5px 5px 0;
            }
        `;
        document.head.appendChild(style);
        
        // Créer le HTML de l'assistant
        this.container.innerHTML = `
            <div class="ai-assistant-container">
                <div class="ai-assistant-header">
                    <h3><i class="fas fa-robot"></i> Assistant IA d'aide à la décision</h3>
                    <div>
                        <button class="btn btn-sm btn-light" id="ai-assistant-toggle-settings">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="btn btn-sm btn-light" id="ai-assistant-toggle">
                            <i class="fas fa-chevron-up"></i>
                        </button>
                    </div>
                </div>
                
                <div class="ai-assistant-body">
                    <div class="ai-assistant-welcome">
                        <p>${this.config.welcomeMessage}</p>
                        <p class="text-muted">${this.config.instructionsMessage}</p>
                    </div>
                    
                    <div class="ai-assistant-chat" id="ai-chat-messages">
                        <!-- Les messages s'afficheront ici -->
                    </div>
                    
                    <div class="ai-assistant-input">
                        <textarea id="ai-input-message" placeholder="Posez votre question médicale ici..."></textarea>
                        <button id="ai-send-button" disabled>
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    
                    <div class="ai-assistant-settings" style="display: none;">
                        <h5>Configuration de l'assistant</h5>
                        
                        <div class="provider-selector">
                            <div class="provider-option ${this.currentProvider === 'openai' ? 'selected' : ''}" data-provider="openai">
                                OpenAI (ChatGPT)
                            </div>
                            <div class="provider-option ${this.currentProvider === 'gemini' ? 'selected' : ''}" data-provider="gemini">
                                Google Gemini
                            </div>
                            <div class="provider-option ${this.currentProvider === 'deepseek' ? 'selected' : ''}" data-provider="deepseek">
                                DeepSeek
                            </div>
                        </div>
                        
                        <div id="openai-settings" ${this.currentProvider === 'openai' ? '' : 'style="display: none;"'}>
                            <label for="openai-api-key">Clé API OpenAI:</label>
                            <input type="password" id="openai-api-key" class="api-key-input" placeholder="sk-...">
                        </div>
                        
                        <div id="gemini-settings" ${this.currentProvider === 'gemini' ? '' : 'style="display: none;"'}>
                            <label for="gemini-api-key">Clé API Google Gemini:</label>
                            <input type="password" id="gemini-api-key" class="api-key-input" placeholder="AI...">
                        </div>
                        
                        <div id="deepseek-settings" ${this.currentProvider === 'deepseek' ? '' : 'style="display: none;"'}>
                            <label for="deepseek-api-key">Clé API DeepSeek:</label>
                            <input type="password" id="deepseek-api-key" class="api-key-input" placeholder="sk-...">
                        </div>
                        
                        <div class="text-center mt-2">
                            <button class="btn btn-sm btn-primary" id="ai-save-settings">Enregistrer</button>
                        </div>
                    </div>
                </div>
                
                <div class="ai-assistant-footer">
                    Cet assistant utilise l'IA pour fournir des suggestions basées sur les recommandations médicales actuelles. 
                    Les recommandations ne remplacent pas le jugement clinique professionnel.
                </div>
            </div>
        `;
    }
    
    // Attacher les événements
    attachEventListeners() {
        // Références aux éléments du DOM
        const toggleButton = document.getElementById('ai-assistant-toggle');
        const toggleSettingsButton = document.getElementById('ai-assistant-toggle-settings');
        const assistantBody = this.container.querySelector('.ai-assistant-body');
        const settingsPanel = this.container.querySelector('.ai-assistant-settings');
        const chatInput = document.getElementById('ai-input-message');
        const sendButton = document.getElementById('ai-send-button');
        const saveSettingsButton = document.getElementById('ai-save-settings');
        const providerOptions = document.querySelectorAll('.provider-option');
        
        // Toggle de l'assistant
        toggleButton.addEventListener('click', () => {
            if (assistantBody.style.display === 'none') {
                assistantBody.style.display = 'block';
                toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
            } else {
                assistantBody.style.display = 'none';
                toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
            }
        });
        
        // Toggle des paramètres
        toggleSettingsButton.addEventListener('click', () => {
            settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
        });
        
        // Événement d'entrée pour activer/désactiver le bouton d'envoi
        chatInput.addEventListener('input', () => {
            // Permettre l'envoi même sans clé API pour la démonstration
            sendButton.disabled = !chatInput.value.trim();
        });
        
        // Envoi du message par clic sur le bouton
        sendButton.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message) {
                this.sendMessage(message);
                chatInput.value = '';
                sendButton.disabled = true;
            }
        });
        
        // Envoi du message par appui sur Entrée (mais Shift+Entrée pour nouvelle ligne)
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (sendButton.disabled) return;
                
                const message = chatInput.value.trim();
                if (message) {
                    this.sendMessage(message);
                    chatInput.value = '';
                    sendButton.disabled = true;
                }
            }
        });
        
        // Changement de fournisseur IA
        providerOptions.forEach(option => {
            option.addEventListener('click', () => {
                const provider = option.getAttribute('data-provider');
                this.currentProvider = provider;
                
                // Mettre à jour l'interface
                providerOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                document.getElementById('openai-settings').style.display = provider === 'openai' ? 'block' : 'none';
                document.getElementById('gemini-settings').style.display = provider === 'gemini' ? 'block' : 'none';
                document.getElementById('deepseek-settings').style.display = provider === 'deepseek' ? 'block' : 'none';
            });
        });
        
        // Enregistrement des paramètres
        saveSettingsButton.addEventListener('click', () => {
            if (this.currentProvider === 'openai') {
                this.apiKey = document.getElementById('openai-api-key').value;
            } else if (this.currentProvider === 'gemini') {
                this.apiKey = document.getElementById('gemini-api-key').value;
            } else if (this.currentProvider === 'deepseek') {
                this.apiKey = document.getElementById('deepseek-api-key').value;
            }
            
            // Activer le bouton d'envoi si une clé API est définie et qu'il y a du texte
            sendButton.disabled = !chatInput.value.trim() || !this.apiKey;
            
            // Enregistrer la configuration en localStorage
            this.saveConfiguration();
            
            // Fermer le panneau des paramètres
            settingsPanel.style.display = 'none';
            
            // Afficher un message de confirmation
            this.showAIMessage("Configuration enregistrée. Je suis prêt à vous aider!");
        });
        
        // Charger la configuration existante
        this.loadConfiguration();
    }
    
    // Envoyer un message à l'IA
    sendMessage(message, contextData = null) {
        const chatBox = document.getElementById('ai-chat-messages');
        
        // Afficher le message de l'utilisateur
        const userMessageElement = document.createElement('div');
        userMessageElement.className = 'user-message';
        userMessageElement.textContent = message;
        chatBox.appendChild(userMessageElement);
        
        // Afficher l'indicateur de frappe
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'ai-typing';
        typingIndicator.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        chatBox.appendChild(typingIndicator);
        
        // Faire défiler vers le bas
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Préparer la requête à l'API
        let prompt = message;
        
        // Si des données contextuelles sont fournies, utiliser un template de prompt
        if (contextData && contextData.type && this.config.promptTemplates[contextData.type]) {
            prompt = this.config.promptTemplates[contextData.type];
            
            // Remplacer les variables du template par les valeurs du contexte
            for (const [key, value] of Object.entries(contextData)) {
                if (key !== 'type') {
                    prompt = prompt.replace(`{${key}}`, value || 'N/A');
                }
            }
        } else {
            // Sinon, utiliser le template général
            prompt = this.config.promptTemplates.general.replace('{query}', message);
        }
        
        // Appeler l'API en fonction du fournisseur sélectionné
        if (this.currentProvider === 'openai') {
            this.callOpenAI(prompt).then(response => {
                // Supprimer l'indicateur de frappe
                chatBox.removeChild(typingIndicator);
                
                // Afficher la réponse
                this.showAIMessage(response);
            }).catch(error => {
                // Supprimer l'indicateur de frappe
                chatBox.removeChild(typingIndicator);
                
                // Afficher l'erreur
                this.showAIMessage(`Désolé, une erreur est survenue: ${error.message}. Veuillez vérifier votre clé API.`);
            });
        } else if (this.currentProvider === 'gemini') {
            this.callGemini(prompt).then(response => {
                // Supprimer l'indicateur de frappe
                chatBox.removeChild(typingIndicator);
                
                // Afficher la réponse
                this.showAIMessage(response);
            }).catch(error => {
                // Supprimer l'indicateur de frappe
                chatBox.removeChild(typingIndicator);
                
                // Afficher l'erreur
                this.showAIMessage(`Désolé, une erreur est survenue: ${error.message}. Veuillez vérifier votre clé API.`);
            });
        } else if (this.currentProvider === 'deepseek') {
            this.callDeepSeek(prompt).then(response => {
                // Supprimer l'indicateur de frappe
                chatBox.removeChild(typingIndicator);
                
                // Afficher la réponse
                this.showAIMessage(response);
            }).catch(error => {
                // Supprimer l'indicateur de frappe
                chatBox.removeChild(typingIndicator);
                
                // Afficher l'erreur
                this.showAIMessage(`Désolé, une erreur est survenue: ${error.message}. Veuillez vérifier votre clé API.`);
            });
        }
    }
    
    // Afficher un message de l'IA
    showAIMessage(message) {
        const chatBox = document.getElementById('ai-chat-messages');
        
        // Créer l'élément de message
        const aiMessageElement = document.createElement('div');
        aiMessageElement.className = 'ai-message';
        aiMessageElement.textContent = message;
        
        // Ajouter le message au chat
        chatBox.appendChild(aiMessageElement);
        
        // Faire défiler vers le bas
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    // Appeler l'API OpenAI
    async callOpenAI(prompt) {
        if (!this.apiKey) {
            // Réponse de démonstration sans API
            return this.getDemoResponse(prompt);
        }
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.openaiModel,
                    messages: [
                        {
                            role: "system",
                            content: "Vous êtes un assistant médical spécialisé en obstétrique pour les sages-femmes. " +
                                    "Vos réponses sont basées sur les recommandations médicales actuelles et la littérature scientifique. " +
                                    "Soyez précis, concis et professionnel. Rappelez toujours que vos conseils ne remplacent pas " +
                                    "le jugement clinique d'un professionnel de santé."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error.message);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Erreur OpenAI:', error);
            throw error;
        }
    }
    
    // Appeler l'API Google Gemini
    async callGemini(prompt) {
        if (!this.apiKey) {
            // Réponse de démonstration sans API
            return this.getDemoResponse(prompt);
        }
        
        try {
            // Exemple de requête à l'API Gemini (à adapter selon la documentation officielle)
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: "Vous êtes un assistant médical spécialisé en obstétrique pour les sages-femmes. " +
                                          "Vos réponses sont basées sur les recommandations médicales actuelles et la littérature scientifique. " +
                                          "Soyez précis, concis et professionnel. Rappelez toujours que vos conseils ne remplacent pas " +
                                          "le jugement clinique d'un professionnel de santé. " +
                                          "Voici la question: " + prompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7
                    }
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error.message);
            }
            
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Erreur Gemini:', error);
            throw error;
        }
    }
    
    // Appeler l'API DeepSeek
    async callDeepSeek(prompt) {
        if (!this.apiKey) {
            // Réponse de démonstration sans API
            return this.getDemoResponse(prompt);
        }
        
        try {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: "system",
                            content: "Vous êtes un assistant médical spécialisé en obstétrique pour les sages-femmes. " +
                                    "Vos réponses sont basées sur les recommandations médicales actuelles et la littérature scientifique. " +
                                    "Soyez précis, concis et professionnel. Rappelez toujours que vos conseils ne remplacent pas " +
                                    "le jugement clinique d'un professionnel de santé."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || "Erreur lors de l'appel à l'API DeepSeek");
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Erreur DeepSeek:', error);
            throw error;
        }
    }
    
    // Sauvegarder la configuration dans localStorage
    saveConfiguration() {
        localStorage.setItem('ai-assistant-provider', this.currentProvider);
        localStorage.setItem(`ai-assistant-${this.currentProvider}-key`, this.apiKey);
    }
    
    // Charger la configuration depuis localStorage
    loadConfiguration() {
        const savedProvider = localStorage.getItem('ai-assistant-provider');
        if (savedProvider) {
            this.currentProvider = savedProvider;
            
            // Mettre à jour l'interface
            const providerOptions = document.querySelectorAll('.provider-option');
            providerOptions.forEach(option => {
                if (option.getAttribute('data-provider') === savedProvider) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
            
            document.getElementById('openai-settings').style.display = savedProvider === 'openai' ? 'block' : 'none';
            document.getElementById('gemini-settings').style.display = savedProvider === 'gemini' ? 'block' : 'none';
            document.getElementById('deepseek-settings').style.display = savedProvider === 'deepseek' ? 'block' : 'none';
        }
        
        // Charger les clés API
        const openaiKey = localStorage.getItem('ai-assistant-openai-key');
        const geminiKey = localStorage.getItem('ai-assistant-gemini-key');
        const deepseekKey = localStorage.getItem('ai-assistant-deepseek-key');
        
        if (openaiKey) {
            document.getElementById('openai-api-key').value = openaiKey;
            if (this.currentProvider === 'openai') {
                this.apiKey = openaiKey;
            }
        }
        
        if (geminiKey) {
            document.getElementById('gemini-api-key').value = geminiKey;
            if (this.currentProvider === 'gemini') {
                this.apiKey = geminiKey;
            }
        }
        
        if (deepseekKey) {
            document.getElementById('deepseek-api-key').value = deepseekKey;
            if (this.currentProvider === 'deepseek') {
                this.apiKey = deepseekKey;
            }
        }
        
        // Mettre à jour l'état du bouton d'envoi
        const chatInput = document.getElementById('ai-input-message');
        const sendButton = document.getElementById('ai-send-button');
        // Permettre l'envoi même sans clé API pour la démonstration
        sendButton.disabled = !chatInput.value.trim();
    }
    
    // Consulter l'IA avec des données de contexte spécifiques
    consultWithContext(contextType, contextData) {
        // Préparer les données de contexte
        const data = { type: contextType, ...contextData };
        
        // Afficher un message indiquant que l'IA analyse les données
        this.showAIMessage(`J'analyse les données fournies (${contextType})...`);
        
        // Envoyer le message avec le contexte
        this.sendMessage("Analyse des données fournies", data);
    }
    
    // Fournir une réponse de démonstration sans appel API
    getDemoResponse(prompt) {
        // Réponses prédéfinies pour la démonstration
        const demoResponses = {
            default: "Bonjour, je suis l'assistant ANIPS-F en mode démonstration. Pour utiliser mes fonctionnalités complètes, veuillez configurer une clé API dans les paramètres. Je peux vous aider avec des questions sur la grossesse, l'accouchement et le suivi obstétrical.",
            
            grossesse: "La grossesse dure en moyenne 40 semaines d'aménorrhée (ou 38 semaines de conception). Elle est divisée en trois trimestres. Le premier trimestre est crucial pour le développement des organes du fœtus. Les consultations prénatales recommandées sont une par mois, avec des échographies vers 12 SA, 22 SA et 32 SA.",
            
            tension: "L'hypertension artérielle pendant la grossesse est définie par une pression systolique ≥ 140 mmHg et/ou une pression diastolique ≥ 90 mmHg. La pré-éclampsie est caractérisée par une hypertension associée à une protéinurie après 20 SA. Une prise en charge rapide est essentielle pour éviter des complications comme l'éclampsie.",
            
            fer: "L'anémie ferriprive est courante pendant la grossesse avec des valeurs d'hémoglobine < 11 g/dL au 1er et 3ème trimestre, et < 10,5 g/dL au 2ème trimestre. Une supplémentation en fer est souvent recommandée, avec une dose de 30 à 60 mg/jour de fer élémentaire.",
            
            accouchement: "Le travail se déroule en trois phases : la dilatation du col (phase de latence puis phase active), l'expulsion (poussées), et la délivrance (expulsion du placenta). La durée moyenne du travail chez une primipare est de 10-12h, et de 6-8h chez une multipare.",
            
            allaitement: "L'allaitement maternel est recommandé exclusivement pendant les 6 premiers mois, puis en complément d'une diversification alimentaire. Il apporte une protection immunitaire au nouveau-né et favorise le lien mère-enfant. La mise au sein précoce et à la demande est encouragée."
        };
        
        // Analyser la question pour déterminer la réponse appropriée
        const lowerPrompt = prompt.toLowerCase();
        let response = demoResponses.default;
        
        if (lowerPrompt.includes('grossesse') || lowerPrompt.includes('enceinte') || lowerPrompt.includes('trimestre')) {
            response = demoResponses.grossesse;
        } else if (lowerPrompt.includes('tension') || lowerPrompt.includes('hypertension') || lowerPrompt.includes('éclampsie')) {
            response = demoResponses.tension;
        } else if (lowerPrompt.includes('fer') || lowerPrompt.includes('anémie') || lowerPrompt.includes('hémoglobine')) {
            response = demoResponses.fer;
        } else if (lowerPrompt.includes('accouchement') || lowerPrompt.includes('travail') || lowerPrompt.includes('contractions')) {
            response = demoResponses.accouchement;
        } else if (lowerPrompt.includes('allaitement') || lowerPrompt.includes('lait') || lowerPrompt.includes('sein')) {
            response = demoResponses.allaitement;
        }
        
        return response + "\n\n*Note: ceci est une réponse de démonstration. Pour des réponses personnalisées et plus précises, configurez une clé API.*";
    }
}

// Fonction pour initialiser l'assistant sur une page
function initializeAIAssistant(containerSelector) {
    const assistant = new AIAssistant();
    if (assistant.initialize(containerSelector)) {
        return assistant;
    }
    return null;
}

// Exposer la fonction d'initialisation et la classe globalement
window.initializeAIAssistant = initializeAIAssistant;
window.AIAssistant = AIAssistant;