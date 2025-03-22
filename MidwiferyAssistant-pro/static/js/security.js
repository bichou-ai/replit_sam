/**
 * Security and Encryption Utilities
 * 
 * This script provides client-side security features for the application,
 * including password validation and local data encryption.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize password strength meter if it exists
    initPasswordStrengthMeter();
    
    // Initialize password validation on registration form
    const registrationForm = document.getElementById('registration-form');
    if (registrationForm) {
        const passwordField = document.getElementById('password');
        const confirmPasswordField = document.getElementById('confirm_password');
        
        if (passwordField && confirmPasswordField) {
            // Validate password on input
            passwordField.addEventListener('input', function() {
                validatePassword(this.value);
            });
            
            // Validate password confirmation
            confirmPasswordField.addEventListener('input', function() {
                validatePasswordMatch(passwordField.value, this.value);
            });
            
            // Validate form on submit
            registrationForm.addEventListener('submit', function(e) {
                if (!validateRegistrationForm()) {
                    e.preventDefault();
                }
            });
        }
    }
    
    // Initialize password validation on change password form
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        const newPasswordField = document.getElementById('new_password');
        const confirmNewPasswordField = document.getElementById('confirm_password');
        
        if (newPasswordField && confirmNewPasswordField) {
            // Validate password on input
            newPasswordField.addEventListener('input', function() {
                validatePassword(this.value);
            });
            
            // Validate password confirmation
            confirmNewPasswordField.addEventListener('input', function() {
                validatePasswordMatch(newPasswordField.value, this.value);
            });
        }
    }
});

/**
 * Initialize password strength meter
 */
function initPasswordStrengthMeter() {
    const passwordStrengthMeter = document.getElementById('password-strength-meter');
    const passwordStrengthText = document.getElementById('password-strength-text');
    
    if (!passwordStrengthMeter || !passwordStrengthText) return;
    
    // Hide initially
    passwordStrengthMeter.style.display = 'none';
    passwordStrengthText.style.display = 'none';
    
    // Get associated password field
    const passwordField = document.querySelector('input[type="password"][data-strength-meter="true"]');
    
    if (passwordField) {
        passwordField.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            updatePasswordStrengthMeter(strength);
        });
        
        passwordField.addEventListener('focus', function() {
            passwordStrengthMeter.style.display = 'block';
            passwordStrengthText.style.display = 'block';
        });
    }
}

/**
 * Calculate password strength score (0-4)
 * 0 = Empty or very weak, 4 = Very strong
 */
function calculatePasswordStrength(password) {
    if (!password) return 0;
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Complexity checks
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    // Add points for complexity
    if (hasLowercase && hasUppercase) score++;
    if (hasDigit) score++;
    if (hasSpecial) score++;
    
    // Cap at 4
    return Math.min(score, 4);
}

/**
 * Update password strength meter UI
 */
function updatePasswordStrengthMeter(strength) {
    const passwordStrengthMeter = document.getElementById('password-strength-meter');
    const passwordStrengthText = document.getElementById('password-strength-text');
    
    if (!passwordStrengthMeter || !passwordStrengthText) return;
    
    // Show strength meter
    passwordStrengthMeter.style.display = 'block';
    passwordStrengthText.style.display = 'block';
    
    // Reset classes
    passwordStrengthMeter.className = 'password-strength-meter';
    
    // Set width based on strength
    passwordStrengthMeter.style.width = `${(strength / 4) * 100}%`;
    
    // Set color and text based on strength
    let strengthClass = '';
    let strengthText = '';
    
    switch (strength) {
        case 0:
            strengthClass = 'strength-very-weak';
            strengthText = 'Très faible';
            break;
        case 1:
            strengthClass = 'strength-weak';
            strengthText = 'Faible';
            break;
        case 2:
            strengthClass = 'strength-medium';
            strengthText = 'Moyen';
            break;
        case 3:
            strengthClass = 'strength-strong';
            strengthText = 'Fort';
            break;
        case 4:
            strengthClass = 'strength-very-strong';
            strengthText = 'Très fort';
            break;
    }
    
    passwordStrengthMeter.classList.add(strengthClass);
    passwordStrengthText.textContent = strengthText;
    passwordStrengthText.className = strengthClass;
}

/**
 * Validate password against security requirements
 */
function validatePassword(password) {
    const passwordFeedback = document.getElementById('password-feedback');
    if (!passwordFeedback) return true;
    
    // Reset feedback
    passwordFeedback.textContent = '';
    passwordFeedback.classList.remove('text-danger', 'text-success');
    
    // Check password requirements
    if (!password) {
        passwordFeedback.textContent = 'Veuillez saisir un mot de passe.';
        passwordFeedback.classList.add('text-danger');
        return false;
    }
    
    if (password.length < 8) {
        passwordFeedback.textContent = 'Le mot de passe doit contenir au moins 8 caractères.';
        passwordFeedback.classList.add('text-danger');
        return false;
    }
    
    // Check complexity
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    let complexityIssues = [];
    
    if (!hasLowercase) complexityIssues.push('minuscule');
    if (!hasUppercase) complexityIssues.push('majuscule');
    if (!hasDigit) complexityIssues.push('chiffre');
    if (!hasSpecial) complexityIssues.push('caractère spécial');
    
    if (complexityIssues.length > 0) {
        passwordFeedback.textContent = `Le mot de passe doit contenir au moins un ${complexityIssues.join(', un ')}.`;
        passwordFeedback.classList.add('text-danger');
        return false;
    }
    
    // Password is valid
    passwordFeedback.textContent = 'Mot de passe valide.';
    passwordFeedback.classList.add('text-success');
    return true;
}

/**
 * Validate that passwords match
 */
function validatePasswordMatch(password, confirmPassword) {
    const confirmFeedback = document.getElementById('confirm-password-feedback');
    if (!confirmFeedback) return true;
    
    // Reset feedback
    confirmFeedback.textContent = '';
    confirmFeedback.classList.remove('text-danger', 'text-success');
    
    // Check if passwords match
    if (!confirmPassword) {
        confirmFeedback.textContent = 'Veuillez confirmer votre mot de passe.';
        confirmFeedback.classList.add('text-danger');
        return false;
    }
    
    if (password !== confirmPassword) {
        confirmFeedback.textContent = 'Les mots de passe ne correspondent pas.';
        confirmFeedback.classList.add('text-danger');
        return false;
    }
    
    // Passwords match
    confirmFeedback.textContent = 'Les mots de passe correspondent.';
    confirmFeedback.classList.add('text-success');
    return true;
}

/**
 * Validate registration form
 */
function validateRegistrationForm() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    
    // Validate username
    if (!username || username.length < 3) {
        alert('Le nom d\'utilisateur doit contenir au moins 3 caractères.');
        return false;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        alert('Veuillez saisir une adresse email valide.');
        return false;
    }
    
    // Validate password
    if (!validatePassword(password)) {
        return false;
    }
    
    // Validate password match
    if (!validatePasswordMatch(password, confirmPassword)) {
        return false;
    }
    
    return true;
}

/**
 * Encrypt sensitive data for local storage (simplified version)
 * In a production app, use a proper encryption library
 */
function encryptData(data, key) {
    // This is a placeholder for actual encryption
    // In production, use the Web Crypto API or a secure library
    
    // Simple XOR encryption (NOT secure, for demo only)
    const encryptedData = btoa(JSON.stringify(data));
    
    return {
        data: encryptedData,
        iv: 'demo-iv',
        timestamp: Date.now()
    };
}

/**
 * Decrypt data from local storage (simplified version)
 */
function decryptData(encryptedObject, key) {
    // This is a placeholder for actual decryption
    // In production, use the Web Crypto API or a secure library
    
    try {
        // Simple XOR decryption (NOT secure, for demo only)
        return JSON.parse(atob(encryptedObject.data));
    } catch (e) {
        console.error('Failed to decrypt data', e);
        return null;
    }
}

/**
 * Securely store data in local storage
 */
function secureStore(key, data, encryptionKey) {
    // Encrypt the data
    const encrypted = encryptData(data, encryptionKey);
    
    // Store in localStorage
    localStorage.setItem(key, JSON.stringify(encrypted));
}

/**
 * Retrieve and decrypt data from local storage
 */
function secureRetrieve(key, encryptionKey) {
    // Get encrypted data from localStorage
    const encryptedStr = localStorage.getItem(key);
    if (!encryptedStr) return null;
    
    try {
        // Parse and decrypt
        const encrypted = JSON.parse(encryptedStr);
        return decryptData(encrypted, encryptionKey);
    } catch (e) {
        console.error('Failed to retrieve secure data', e);
        return null;
    }
}
