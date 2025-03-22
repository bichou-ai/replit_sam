import json
from datetime import datetime, timedelta
from flask import render_template, redirect, url_for, flash, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash
from app import app, db
from models import User, Patient, BloodPressureRecord, BiomedicalRecord, UltrasoundRecord, AuditLog, DeliveryRecord, BabyRecord, PostnatalCheckup, VaccinationRecord, BreastfeedingRecord, PostnatalCareReminder
from utils import calculate_gestational_age, get_gestational_age_recommendations, analyze_blood_results, evaluate_blood_pressure

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(username=username).first()
        
        if not user or not user.check_password(password):
            flash('Identifiants incorrects. Veuillez réessayer.', 'danger')
            return redirect(url_for('login'))
        
        login_user(user, remember=remember)
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Log the login action
        log = AuditLog(
            user_id=user.id,
            action="Connexion",
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()
        
        next_page = request.args.get('next')
        return redirect(next_page or url_for('dashboard'))
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Validate form
        if not username or not email or not password:
            flash('Tous les champs sont obligatoires.', 'danger')
            return redirect(url_for('register'))
        
        if password != confirm_password:
            flash('Les mots de passe ne correspondent pas.', 'danger')
            return redirect(url_for('register'))
        
        # Check if user already exists
        user_exists = User.query.filter((User.username == username) | (User.email == email)).first()
        if user_exists:
            flash('Un utilisateur avec cet identifiant ou cet email existe déjà.', 'danger')
            return redirect(url_for('register'))
        
        # Create new user
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        # Log the registration
        log = AuditLog(
            user_id=new_user.id,
            action="Inscription",
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()
        
        flash('Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    # Log the logout action
    log = AuditLog(
        user_id=current_user.id,
        action="Déconnexion",
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()
    
    logout_user()
    flash('Vous avez été déconnecté.', 'info')
    return redirect(url_for('login'))

# Main application routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    # Get count of patients
    patient_count = Patient.query.filter_by(user_id=current_user.id).count()
    
    # Get recent blood pressure records
    recent_bp = BloodPressureRecord.query.join(Patient).filter(
        Patient.user_id == current_user.id
    ).order_by(BloodPressureRecord.recorded_at.desc()).limit(5).all()
    
    return render_template(
        'dashboard.html',
        patient_count=patient_count,
        recent_bp=recent_bp
    )

@app.route('/calculateur')
@login_required
def calculator():
    return render_template('calculator.html', default_cycle_length=current_user.default_cycle_length)

@app.route('/api/calculate_gestational_age', methods=['POST'])
@login_required
def api_calculate_gestational_age():
    data = request.json
    last_period = datetime.strptime(data['lastPeriod'], '%Y-%m-%d')
    cycle_length = int(data['cycleLength'])
    
    weeks, days = calculate_gestational_age(last_period, cycle_length)
    due_date = last_period + timedelta(days=280 + (cycle_length - 28))
    
    recommendations = get_gestational_age_recommendations(weeks)
    
    return jsonify({
        'weeks': weeks,
        'days': days,
        'dueDate': due_date.strftime('%d/%m/%Y'),
        'recommendations': recommendations
    })

@app.route('/checklists')
@login_required
def checklists():
    return render_template('checklists.html')

@app.route('/biomedical')
@login_required
def biomedical():
    return render_template('biomedical.html')

@app.route('/api/analyze_blood_results', methods=['POST'])
@login_required
def api_analyze_blood_results():
    data = request.json
    hemoglobin = float(data.get('hemoglobin', 0))
    platelets = int(data.get('platelets', 0))
    ferritin = float(data.get('ferritin', 0)) if data.get('ferritin') else None
    hematocrit = float(data.get('hematocrit', 0)) if data.get('hematocrit') else None
    ldh = float(data.get('ldh', 0)) if data.get('ldh') else None
    alt = float(data.get('alt', 0)) if data.get('alt') else None
    ast = float(data.get('ast', 0)) if data.get('ast') else None
    
    results = analyze_blood_results(hemoglobin, platelets, ferritin, hematocrit, ldh, alt, ast)
    
    # If patient ID is provided, save the record
    if 'patientId' in data and data['patientId']:
        patient_id = int(data['patientId'])
        
        record = BiomedicalRecord(
            hemoglobin=hemoglobin,
            platelets=platelets,
            ferritin=ferritin,
            hematocrit=hematocrit,
            ldh=ldh,
            alt=alt,
            ast=ast,
            notes=data.get('notes', ''),
            patient_id=patient_id
        )
        
        db.session.add(record)
        db.session.commit()
        
        # Log the action
        log = AuditLog(
            user_id=current_user.id,
            action="Enregistrement d'analyse biomédicale",
            details=f"Patient ID: {patient_id}",
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()
    
    return jsonify(results)

@app.route('/blood_pressure')
@login_required
def blood_pressure():
    # Get patients for the dropdown menu
    patients = Patient.query.filter_by(user_id=current_user.id).all()
    return render_template('blood_pressure.html', patients=patients)

@app.route('/api/record_blood_pressure', methods=['POST'])
@login_required
def api_record_blood_pressure():
    data = request.json
    systolic = int(data['systolic'])
    diastolic = int(data['diastolic'])
    heart_rate = int(data.get('heartRate', 0)) if data.get('heartRate') else None
    patient_id = int(data.get('patientId')) if data.get('patientId') else None
    notes = data.get('notes', '')
    
    result = evaluate_blood_pressure(systolic, diastolic)
    
    # Record the blood pressure measurement if a patient is selected
    if patient_id:
        record = BloodPressureRecord(
            systolic=systolic,
            diastolic=diastolic,
            heart_rate=heart_rate,
            notes=notes,
            patient_id=patient_id,
            user_id=current_user.id
        )
        
        db.session.add(record)
        db.session.commit()
        
        # Log the action
        log = AuditLog(
            user_id=current_user.id,
            action="Enregistrement de tension artérielle",
            details=f"Patient ID: {patient_id}, TA: {systolic}/{diastolic}",
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()
    
    return jsonify({
        'status': result['status'],
        'message': result['message'],
        'saved': patient_id is not None
    })

@app.route('/ultrasound')
@login_required
def ultrasound():
    return render_template('ultrasound.html')

@app.route('/emergency')
@login_required
def emergency():
    return render_template('emergency.html')

@app.route('/patients', methods=['GET', 'POST'])
@login_required
def patients():
    if request.method == 'POST':
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        date_of_birth = datetime.strptime(request.form.get('date_of_birth'), '%Y-%m-%d') if request.form.get('date_of_birth') else None
        last_period_date = datetime.strptime(request.form.get('last_period_date'), '%Y-%m-%d') if request.form.get('last_period_date') else None
        cycle_length = int(request.form.get('cycle_length', 28))
        notes = request.form.get('notes', '')
        
        new_patient = Patient(
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            last_period_date=last_period_date,
            cycle_length=cycle_length,
            notes=notes,
            user_id=current_user.id
        )
        
        db.session.add(new_patient)
        db.session.commit()
        
        # Log the action
        log = AuditLog(
            user_id=current_user.id,
            action="Création de patient",
            details=f"Patient: {first_name} {last_name}",
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()
        
        flash('Patient ajouté avec succès.', 'success')
        return redirect(url_for('patients'))
    
    patients_list = Patient.query.filter_by(user_id=current_user.id).all()
    return render_template('patients.html', patients=patients_list)

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'POST':
        # Update profile
        if 'update_profile' in request.form:
            current_user.username = request.form.get('username')
            current_user.email = request.form.get('email')
            current_user.default_cycle_length = int(request.form.get('default_cycle_length', 28))
            
            db.session.commit()
            
            flash('Profil mis à jour avec succès.', 'success')
        
        # Change password
        elif 'change_password' in request.form:
            current_password = request.form.get('current_password')
            new_password = request.form.get('new_password')
            confirm_password = request.form.get('confirm_password')
            
            if not current_user.check_password(current_password):
                flash('Mot de passe actuel incorrect.', 'danger')
            elif new_password != confirm_password:
                flash('Les nouveaux mots de passe ne correspondent pas.', 'danger')
            else:
                current_user.set_password(new_password)
                db.session.commit()
                
                # Log the action
                log = AuditLog(
                    user_id=current_user.id,
                    action="Changement de mot de passe",
                    ip_address=request.remote_addr
                )
                db.session.add(log)
                db.session.commit()
                
                flash('Mot de passe modifié avec succès.', 'success')
        
        return redirect(url_for('profile'))
    
    # Fetch the audit logs for the user
    audit_logs = AuditLog.query.filter_by(user_id=current_user.id).order_by(AuditLog.timestamp.desc()).limit(10).all()
    
    return render_template('profile.html', user=current_user, audit_logs=audit_logs)

# Error handling
@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error='Page non trouvée', message='La page que vous recherchez n\'existe pas.', code=404), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('error.html', error='Erreur serveur', message='Une erreur est survenue sur le serveur.', code=500), 500

# Module de Suivi Postnatal
@app.route('/postnatal')
@login_required
def postnatal():
    return render_template('postnatal.html')

@app.route('/api/patients')
@login_required
def api_patients():
    patients = Patient.query.filter_by(user_id=current_user.id).all()
    
    patients_data = []
    for patient in patients:
        patients_data.append({
            'id': patient.id,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'date_of_birth': patient.date_of_birth.strftime('%Y-%m-%d') if patient.date_of_birth else None,
            'last_period_date': patient.last_period_date.strftime('%Y-%m-%d') if patient.last_period_date else None
        })
    
    return jsonify({'patients': patients_data})

@app.route('/api/postnatal/babies')
@login_required
def api_babies():
    # Récupérer tous les bébés associés aux patients du midwife
    babies = BabyRecord.query.join(Patient).filter(Patient.user_id == current_user.id).all()
    
    babies_data = []
    for baby in babies:
        babies_data.append({
            'id': baby.id,
            'first_name': baby.first_name,
            'last_name': baby.last_name,
            'birth_date': baby.birth_date.strftime('%Y-%m-%d'),
            'mother_id': baby.mother_id,
            'mother_name': f"{baby.mother.last_name} {baby.mother.first_name}"
        })
    
    return jsonify({'babies': babies_data})

@app.route('/api/postnatal/deliveries')
@login_required
def api_deliveries():
    # Récupérer tous les accouchements des patients du midwife
    deliveries = DeliveryRecord.query.join(Patient).filter(Patient.user_id == current_user.id).order_by(DeliveryRecord.delivery_date.desc()).all()
    
    deliveries_data = []
    for delivery in deliveries:
        deliveries_data.append({
            'id': delivery.id,
            'delivery_date': delivery.delivery_date.isoformat(),
            'delivery_type': delivery.delivery_type,
            'delivery_location': delivery.delivery_location,
            'complications': delivery.complications,
            'patient_id': delivery.patient_id,
            'patient_name': f"{delivery.patient.last_name} {delivery.patient.first_name}"
        })
    
    return jsonify({'deliveries': deliveries_data})

@app.route('/api/postnatal/delivery/<int:delivery_id>')
@login_required
def api_delivery_details(delivery_id):
    # Récupérer l'accouchement et vérifier qu'il appartient à un patient du midwife connecté
    delivery = DeliveryRecord.query.join(Patient).filter(
        DeliveryRecord.id == delivery_id,
        Patient.user_id == current_user.id
    ).first()
    
    if not delivery:
        return jsonify({'error': 'Accouchement non trouvé'}), 404
    
    # Récupérer le bébé associé
    baby = BabyRecord.query.filter_by(delivery_id=delivery_id).first()
    
    if not baby:
        return jsonify({'error': 'Bébé non trouvé pour cet accouchement'}), 404
    
    # Préparer les données
    delivery_data = {
        'id': delivery.id,
        'delivery_date': delivery.delivery_date.isoformat(),
        'delivery_type': delivery.delivery_type,
        'delivery_location': delivery.delivery_location,
        'complications': delivery.complications,
        'blood_loss': delivery.blood_loss,
        'anesthesia_type': delivery.anesthesia_type,
        'delivery_duration': delivery.delivery_duration,
        'notes': delivery.notes,
        'patient_id': delivery.patient_id,
        'patient_name': f"{delivery.patient.last_name} {delivery.patient.first_name}",
        'baby': {
            'id': baby.id,
            'first_name': baby.first_name,
            'last_name': baby.last_name,
            'birth_date': baby.birth_date.isoformat(),
            'gender': baby.gender,
            'birth_weight': baby.birth_weight,
            'birth_length': baby.birth_length,
            'head_circumference': baby.head_circumference,
            'apgar_1min': baby.apgar_1min,
            'apgar_5min': baby.apgar_5min,
            'apgar_10min': baby.apgar_10min,
            'resuscitation_required': baby.resuscitation_required,
            'resuscitation_details': baby.resuscitation_details,
            'oxygen_required': baby.oxygen_required,
            'congenital_anomalies': baby.congenital_anomalies,
            'nicu_required': baby.nicu_required
        }
    }
    
    return jsonify(delivery_data)

@app.route('/api/postnatal/delivery', methods=['POST'])
@login_required
def api_record_delivery():
    data = request.json
    delivery_data = data.get('delivery', {})
    baby_data = data.get('baby', {})
    
    # Valider que le patient appartient au midwife connecté
    patient_id = int(delivery_data.get('patient_id'))
    patient = Patient.query.filter_by(id=patient_id, user_id=current_user.id).first()
    
    if not patient:
        return jsonify({'error': 'Patient non trouvé'}), 404
    
    # Créer l'enregistrement d'accouchement
    delivery = DeliveryRecord(
        delivery_date=datetime.strptime(delivery_data.get('delivery_date'), '%Y-%m-%dT%H:%M'),
        delivery_type=delivery_data.get('delivery_type'),
        delivery_location=delivery_data.get('delivery_location'),
        complications=delivery_data.get('complications'),
        blood_loss=int(delivery_data.get('blood_loss')) if delivery_data.get('blood_loss') else None,
        anesthesia_type=delivery_data.get('anesthesia_type'),
        delivery_duration=int(delivery_data.get('delivery_duration')) if delivery_data.get('delivery_duration') else None,
        notes=delivery_data.get('notes'),
        patient_id=patient_id,
        user_id=current_user.id
    )
    
    db.session.add(delivery)
    db.session.flush()  # Pour obtenir l'ID de l'accouchement avant commit
    
    # Créer l'enregistrement du bébé
    baby = BabyRecord(
        first_name=baby_data.get('first_name'),
        last_name=baby_data.get('last_name'),
        birth_date=datetime.strptime(delivery_data.get('delivery_date'), '%Y-%m-%dT%H:%M'),
        gender=baby_data.get('gender'),
        birth_weight=float(baby_data.get('birth_weight')),
        birth_length=float(baby_data.get('birth_length')) if baby_data.get('birth_length') else None,
        head_circumference=float(baby_data.get('head_circumference')) if baby_data.get('head_circumference') else None,
        apgar_1min=int(baby_data.get('apgar_1min')) if baby_data.get('apgar_1min') else None,
        apgar_5min=int(baby_data.get('apgar_5min')) if baby_data.get('apgar_5min') else None,
        apgar_10min=int(baby_data.get('apgar_10min')) if baby_data.get('apgar_10min') else None,
        resuscitation_required=baby_data.get('resuscitation_required', False),
        resuscitation_details=baby_data.get('resuscitation_details'),
        oxygen_required=baby_data.get('oxygen_required', False),
        congenital_anomalies=baby_data.get('congenital_anomalies'),
        nicu_required=baby_data.get('nicu_required', False),
        notes=baby_data.get('notes'),
        mother_id=patient_id,
        delivery_id=delivery.id
    )
    
    db.session.add(baby)
    
    # Créer des rappels de suivi automatiques
    # 1. Visite postnatale pour la mère dans les 24-48h
    mother_reminder = PostnatalCareReminder(
        title="Visite postnatale précoce",
        description="Évaluation de la récupération post-partum, saignements, signes vitaux, involution utérine",
        reminder_date=delivery.delivery_date + timedelta(days=1),
        reminder_type="mother",
        priority="high",
        patient_id=patient_id,
        user_id=current_user.id
    )
    
    # 2. Suivi du bébé à 1 semaine
    baby_reminder = PostnatalCareReminder(
        title="Suivi néonatal à 1 semaine",
        description="Contrôle de poids, ictère, alimentation, soins du cordon, signes vitaux",
        reminder_date=delivery.delivery_date + timedelta(days=7),
        reminder_type="baby",
        priority="high",
        baby_id=baby.id,
        user_id=current_user.id
    )
    
    db.session.add(mother_reminder)
    db.session.add(baby_reminder)
    
    # Journal d'audit
    log = AuditLog(
        user_id=current_user.id,
        action="Enregistrement d'accouchement",
        details=f"Patient ID: {patient_id}, Type: {delivery_data.get('delivery_type')}",
        ip_address=request.remote_addr
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'delivery_id': delivery.id,
        'baby_id': baby.id
    })

@app.route('/api/postnatal/mother-checkups/<int:mother_id>')
@login_required
def api_mother_checkups(mother_id):
    # Vérifier que la patiente appartient au midwife connecté
    patient = Patient.query.filter_by(id=mother_id, user_id=current_user.id).first()
    
    if not patient:
        return jsonify({'error': 'Patient non trouvé'}), 404
    
    # Récupérer les suivis
    checkups = PostnatalCheckup.query.filter_by(
        patient_id=mother_id, checkup_type='mother'
    ).order_by(PostnatalCheckup.checkup_date.desc()).all()
    
    # Récupérer l'accouchement le plus récent
    delivery = DeliveryRecord.query.filter_by(
        patient_id=mother_id
    ).order_by(DeliveryRecord.delivery_date.desc()).first()
    
    delivery_data = None
    if delivery:
        delivery_data = {
            'id': delivery.id,
            'delivery_date': delivery.delivery_date.isoformat(),
            'delivery_type': delivery.delivery_type,
            'complications': delivery.complications
        }
    
    # Préparer les données des suivis
    checkups_data = []
    for checkup in checkups:
        checkups_data.append({
            'id': checkup.id,
            'checkup_date': checkup.checkup_date.isoformat(),
            'temperature': checkup.temperature,
            'heart_rate': checkup.heart_rate,
            'blood_pressure_systolic': checkup.blood_pressure_systolic,
            'blood_pressure_diastolic': checkup.blood_pressure_diastolic,
            'weight': checkup.weight,
            'symptoms': checkup.symptoms,
            'recommendations': checkup.recommendations,
            'next_checkup_date': checkup.next_checkup_date.isoformat() if checkup.next_checkup_date else None
        })
    
    return jsonify({
        'patient': {
            'id': patient.id,
            'first_name': patient.first_name,
            'last_name': patient.last_name
        },
        'delivery': delivery_data,
        'checkups': checkups_data
    })

@app.route('/api/postnatal/baby/<int:baby_id>')
@login_required
def api_baby_info(baby_id):
    # Récupérer le bébé et vérifier qu'il appartient à un patient du midwife connecté
    baby = BabyRecord.query.join(Patient).filter(
        BabyRecord.id == baby_id,
        Patient.user_id == current_user.id
    ).first()
    
    if not baby:
        return jsonify({'error': 'Bébé non trouvé'}), 404
    
    # Récupérer les suivis du bébé
    checkups = PostnatalCheckup.query.filter_by(
        baby_id=baby_id, checkup_type='baby'
    ).order_by(PostnatalCheckup.checkup_date.desc()).all()
    
    # Préparer les données
    baby_data = {
        'id': baby.id,
        'first_name': baby.first_name,
        'last_name': baby.last_name,
        'birth_date': baby.birth_date.isoformat(),
        'gender': baby.gender,
        'birth_weight': baby.birth_weight,
        'birth_length': baby.birth_length,
        'head_circumference': baby.head_circumference,
        'apgar_1min': baby.apgar_1min,
        'apgar_5min': baby.apgar_5min,
        'apgar_10min': baby.apgar_10min,
        'resuscitation_required': baby.resuscitation_required,
        'oxygen_required': baby.oxygen_required,
        'nicu_required': baby.nicu_required,
        'mother_id': baby.mother_id,
        'mother_name': f"{baby.mother.last_name} {baby.mother.first_name}",
        'delivery_type': baby.delivery.delivery_type
    }
    
    # Préparer les données des suivis
    checkups_data = []
    for checkup in checkups:
        checkups_data.append({
            'id': checkup.id,
            'checkup_date': checkup.checkup_date.isoformat(),
            'temperature': checkup.temperature,
            'heart_rate': checkup.heart_rate,
            'respiratory_rate': checkup.respiratory_rate,
            'weight': checkup.weight,
            'length': None,  # Cette donnée serait ajoutée dans une mise à jour future
            'symptoms': checkup.symptoms,
            'recommendations': checkup.recommendations
        })
    
    baby_data['checkups'] = checkups_data
    
    return jsonify(baby_data)

@app.route('/api/postnatal/breastfeeding/<int:baby_id>')
@login_required
def api_breastfeeding_records(baby_id):
    # Vérifier que le bébé appartient à un patient du midwife connecté
    baby = BabyRecord.query.join(Patient).filter(
        BabyRecord.id == baby_id,
        Patient.user_id == current_user.id
    ).first()
    
    if not baby:
        return jsonify({'error': 'Bébé non trouvé'}), 404
    
    # Récupérer les enregistrements d'allaitement
    records = BreastfeedingRecord.query.filter_by(
        baby_id=baby_id
    ).order_by(BreastfeedingRecord.feeding_date.desc()).all()
    
    # Préparer les données
    records_data = []
    for record in records:
        records_data.append({
            'id': record.id,
            'feeding_date': record.feeding_date.isoformat(),
            'feeding_type': record.feeding_type,
            'duration': record.duration,
            'issues': record.issues,
            'notes': record.notes
        })
    
    return jsonify({
        'baby_id': baby_id,
        'baby_name': baby.first_name or f"Bébé de {baby.mother.first_name} {baby.mother.last_name}",
        'records': records_data
    })

@app.route('/api/postnatal/vaccinations/<int:baby_id>')
@login_required
def api_vaccination_records(baby_id):
    # Vérifier que le bébé appartient à un patient du midwife connecté
    baby = BabyRecord.query.join(Patient).filter(
        BabyRecord.id == baby_id,
        Patient.user_id == current_user.id
    ).first()
    
    if not baby:
        return jsonify({'error': 'Bébé non trouvé'}), 404
    
    # Récupérer les vaccinations
    vaccinations = VaccinationRecord.query.filter_by(
        baby_id=baby_id
    ).order_by(VaccinationRecord.date_administered.desc()).all()
    
    # Préparer les données
    vaccinations_data = []
    for vaccination in vaccinations:
        vaccinations_data.append({
            'id': vaccination.id,
            'vaccine_name': vaccination.vaccine_name,
            'date_administered': vaccination.date_administered.isoformat(),
            'dose': vaccination.dose,
            'route': vaccination.route,
            'site': vaccination.site,
            'lot_number': vaccination.lot_number,
            'expiration_date': vaccination.expiration_date.isoformat() if vaccination.expiration_date else None,
            'reaction': vaccination.reaction,
            'notes': vaccination.notes
        })
    
    return jsonify({
        'baby_id': baby_id,
        'baby_name': baby.first_name or f"Bébé de {baby.mother.first_name} {baby.mother.last_name}",
        'vaccinations': vaccinations_data
    })

@app.route('/api/postnatal/reminders')
@login_required
def api_reminders():
    # Récupérer les filtres
    reminder_type = request.args.get('type', 'all')
    priority = request.args.get('priority', 'all')
    status = request.args.get('status', 'all')
    
    # Construire la requête de base
    query = PostnatalCareReminder.query.filter_by(user_id=current_user.id)
    
    # Appliquer les filtres
    if reminder_type != 'all':
        query = query.filter_by(reminder_type=reminder_type)
    
    if priority != 'all':
        query = query.filter_by(priority=priority)
    
    if status == 'pending':
        query = query.filter_by(completed=False)
    elif status == 'completed':
        query = query.filter_by(completed=True)
    
    # Exécuter la requête
    reminders = query.order_by(PostnatalCareReminder.reminder_date).all()
    
    # Préparer les données
    reminders_data = []
    for reminder in reminders:
        reminder_data = {
            'id': reminder.id,
            'title': reminder.title,
            'description': reminder.description,
            'reminder_date': reminder.reminder_date.isoformat(),
            'reminder_type': reminder.reminder_type,
            'priority': reminder.priority,
            'completed': reminder.completed
        }
        
        if reminder.patient_id:
            patient = Patient.query.get(reminder.patient_id)
            reminder_data['patient_name'] = f"{patient.last_name} {patient.first_name}" if patient else None
        
        if reminder.baby_id:
            baby = BabyRecord.query.get(reminder.baby_id)
            reminder_data['baby_name'] = baby.first_name or f"Bébé de {baby.mother.last_name}" if baby else None
        
        reminders_data.append(reminder_data)
    
    return jsonify({'reminders': reminders_data})

@app.route('/api/postnatal/reminder/<int:reminder_id>/complete', methods=['POST'])
@login_required
def api_complete_reminder(reminder_id):
    reminder = PostnatalCareReminder.query.filter_by(id=reminder_id, user_id=current_user.id).first()
    
    if not reminder:
        return jsonify({'error': 'Rappel non trouvé'}), 404
    
    reminder.completed = True
    db.session.commit()
    
    # Journal d'audit
    log = AuditLog(
        user_id=current_user.id,
        action="Complétion de rappel postnatal",
        details=f"Rappel ID: {reminder_id}, Titre: {reminder.title}",
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/api/postnatal/reminder/<int:reminder_id>', methods=['GET'])
@login_required
def api_reminder_details(reminder_id):
    reminder = PostnatalCareReminder.query.filter_by(id=reminder_id, user_id=current_user.id).first()
    
    if not reminder:
        return jsonify({'error': 'Rappel non trouvé'}), 404
    
    reminder_data = {
        'id': reminder.id,
        'title': reminder.title,
        'description': reminder.description,
        'reminder_date': reminder.reminder_date.isoformat(),
        'reminder_type': reminder.reminder_type,
        'priority': reminder.priority,
        'completed': reminder.completed,
        'created_at': reminder.created_at.isoformat()
    }
    
    if reminder.patient_id:
        patient = Patient.query.get(reminder.patient_id)
        if patient:
            reminder_data['patient_id'] = patient.id
            reminder_data['patient_name'] = f"{patient.last_name} {patient.first_name}"
    
    if reminder.baby_id:
        baby = BabyRecord.query.get(reminder.baby_id)
        if baby:
            reminder_data['baby_id'] = baby.id
            reminder_data['baby_name'] = baby.first_name or f"Bébé de {baby.mother.last_name}"
    
    return jsonify(reminder_data)

@app.route('/api/postnatal/reminder', methods=['POST'])
@login_required
def api_create_reminder():
    data = request.json
    
    # Créer le rappel
    reminder = PostnatalCareReminder(
        title=data.get('title'),
        description=data.get('description'),
        reminder_date=datetime.strptime(data.get('reminder_date'), '%Y-%m-%d'),
        reminder_type=data.get('reminder_type'),
        priority=data.get('priority', 'normal'),
        user_id=current_user.id
    )
    
    # Associer au patient ou au bébé selon le type
    reminder_type = data.get('reminder_type')
    
    if reminder_type in ['mother', 'both'] and 'patient_id' in data:
        patient_id = int(data.get('patient_id'))
        # Vérifier que le patient appartient au midwife connecté
        patient = Patient.query.filter_by(id=patient_id, user_id=current_user.id).first()
        if not patient:
            return jsonify({'error': 'Patient non trouvé'}), 404
        
        reminder.patient_id = patient_id
    
    if reminder_type in ['baby', 'both'] and 'baby_id' in data:
        baby_id = int(data.get('baby_id'))
        # Vérifier que le bébé appartient à un patient du midwife connecté
        baby = BabyRecord.query.join(Patient).filter(
            BabyRecord.id == baby_id,
            Patient.user_id == current_user.id
        ).first()
        
        if not baby:
            return jsonify({'error': 'Bébé non trouvé'}), 404
        
        reminder.baby_id = baby_id
    
    db.session.add(reminder)
    
    # Journal d'audit
    log = AuditLog(
        user_id=current_user.id,
        action="Création de rappel postnatal",
        details=f"Titre: {reminder.title}, Type: {reminder.reminder_type}",
        ip_address=request.remote_addr
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({'success': True, 'reminder_id': reminder.id})

@app.route('/api/postnatal/checkup/<int:checkup_id>', methods=['GET'])
@login_required
def api_checkup_details(checkup_id):
    checkup = PostnatalCheckup.query.filter_by(id=checkup_id, user_id=current_user.id).first()
    
    if not checkup:
        return jsonify({'error': 'Examen non trouvé'}), 404
    
    checkup_data = {
        'id': checkup.id,
        'checkup_date': checkup.checkup_date.isoformat(),
        'checkup_type': checkup.checkup_type,
        'temperature': checkup.temperature,
        'heart_rate': checkup.heart_rate,
        'blood_pressure_systolic': checkup.blood_pressure_systolic,
        'blood_pressure_diastolic': checkup.blood_pressure_diastolic,
        'respiratory_rate': checkup.respiratory_rate,
        'weight': checkup.weight,
        'symptoms': checkup.symptoms,
        'physical_exam': checkup.physical_exam,
        'recommendations': checkup.recommendations,
        'medications': checkup.medications,
        'next_checkup_date': checkup.next_checkup_date.isoformat() if checkup.next_checkup_date else None,
        'notes': checkup.notes
    }
    
    if checkup.checkup_type == 'mother' and checkup.patient_id:
        patient = Patient.query.get(checkup.patient_id)
        checkup_data['patient_id'] = patient.id
        checkup_data['patient_name'] = f"{patient.last_name} {patient.first_name}"
    
    if checkup.checkup_type == 'baby' and checkup.baby_id:
        baby = BabyRecord.query.get(checkup.baby_id)
        checkup_data['baby_id'] = baby.id
        checkup_data['baby_name'] = baby.first_name or f"Bébé de {baby.mother.last_name}"
    
    return jsonify(checkup_data)

@app.route('/api/postnatal/vaccination/<int:vaccination_id>', methods=['GET'])
@login_required
def api_vaccination_details(vaccination_id):
    vaccination = VaccinationRecord.query.filter_by(id=vaccination_id, user_id=current_user.id).first()
    
    if not vaccination:
        return jsonify({'error': 'Vaccination non trouvée'}), 404
    
    # Vérifier que le bébé appartient à un patient du midwife
    baby = BabyRecord.query.join(Patient).filter(
        BabyRecord.id == vaccination.baby_id,
        Patient.user_id == current_user.id
    ).first()
    
    if not baby:
        return jsonify({'error': 'Bébé non trouvé'}), 404
    
    vaccination_data = {
        'id': vaccination.id,
        'vaccine_name': vaccination.vaccine_name,
        'date_administered': vaccination.date_administered.isoformat(),
        'dose': vaccination.dose,
        'route': vaccination.route,
        'site': vaccination.site,
        'lot_number': vaccination.lot_number,
        'expiration_date': vaccination.expiration_date.isoformat() if vaccination.expiration_date else None,
        'reaction': vaccination.reaction,
        'notes': vaccination.notes,
        'baby_id': baby.id,
        'baby_name': baby.first_name or f"Bébé de {baby.mother.last_name} {baby.mother.first_name}"
    }
    
    return jsonify(vaccination_data)

@app.route('/api/postnatal/breastfeeding', methods=['POST'])
@login_required
def api_record_breastfeeding():
    data = request.json
    
    # Vérifier que le bébé appartient à un patient du midwife
    baby_id = int(data.get('baby_id'))
    baby = BabyRecord.query.join(Patient).filter(
        BabyRecord.id == baby_id,
        Patient.user_id == current_user.id
    ).first()
    
    if not baby:
        return jsonify({'error': 'Bébé non trouvé'}), 404
    
    # Vérifier que la mère est bien la patiente du midwife
    mother_id = int(data.get('mother_id'))
    mother = Patient.query.filter_by(id=mother_id, user_id=current_user.id).first()
    
    if not mother:
        return jsonify({'error': 'Mère non trouvée'}), 404
    
    # Créer l'enregistrement d'allaitement
    breastfeeding = BreastfeedingRecord(
        feeding_date=datetime.strptime(data.get('feeding_date'), '%Y-%m-%dT%H:%M'),
        feeding_type=data.get('feeding_type'),
        duration=int(data.get('duration')) if data.get('duration') else None,
        issues=data.get('issues'),
        notes=data.get('notes'),
        mother_id=mother_id,
        baby_id=baby_id,
        user_id=current_user.id
    )
    
    db.session.add(breastfeeding)
    
    # Journal d'audit
    log = AuditLog(
        user_id=current_user.id,
        action="Enregistrement d'allaitement",
        details=f"Bébé ID: {baby_id}, Type: {data.get('feeding_type')}",
        ip_address=request.remote_addr
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({'success': True, 'breastfeeding_id': breastfeeding.id})

@app.route('/api/postnatal/vaccination', methods=['POST'])
@login_required
def api_record_vaccination():
    data = request.json
    
    # Vérifier que le bébé appartient à un patient du midwife
    baby_id = int(data.get('baby_id'))
    baby = BabyRecord.query.join(Patient).filter(
        BabyRecord.id == baby_id,
        Patient.user_id == current_user.id
    ).first()
    
    if not baby:
        return jsonify({'error': 'Bébé non trouvé'}), 404
    
    # Analyser la date d'expiration si fournie
    expiration_date = None
    if data.get('expiration_date'):
        expiration_date = datetime.strptime(data.get('expiration_date'), '%Y-%m-%d').date()
    
    # Créer l'enregistrement de vaccination
    vaccination = VaccinationRecord(
        vaccine_name=data.get('vaccine_name'),
        date_administered=datetime.strptime(data.get('date_administered'), '%Y-%m-%dT%H:%M'),
        dose=data.get('dose'),
        route=data.get('route'),
        site=data.get('site'),
        lot_number=data.get('lot_number'),
        expiration_date=expiration_date,
        reaction=data.get('reaction'),
        notes=data.get('notes'),
        baby_id=baby_id,
        user_id=current_user.id
    )
    
    db.session.add(vaccination)
    
    # Journal d'audit
    log = AuditLog(
        user_id=current_user.id,
        action="Enregistrement de vaccination",
        details=f"Bébé ID: {baby_id}, Vaccin: {data.get('vaccine_name')}",
        ip_address=request.remote_addr
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({'success': True, 'vaccination_id': vaccination.id})

@app.route('/api/postnatal/checkup', methods=['POST'])
@login_required
def api_record_checkup():
    data = request.json
    checkup_type = data.get('checkup_type')
    
    # Créer le checkup de base
    checkup = PostnatalCheckup(
        checkup_date=datetime.strptime(data.get('checkup_date'), '%Y-%m-%dT%H:%M'),
        checkup_type=checkup_type,
        temperature=float(data.get('temperature')) if data.get('temperature') else None,
        heart_rate=int(data.get('heart_rate')) if data.get('heart_rate') else None,
        blood_pressure_systolic=int(data.get('blood_pressure_systolic')) if data.get('blood_pressure_systolic') else None,
        blood_pressure_diastolic=int(data.get('blood_pressure_diastolic')) if data.get('blood_pressure_diastolic') else None,
        respiratory_rate=int(data.get('respiratory_rate')) if data.get('respiratory_rate') else None,
        weight=float(data.get('weight')) if data.get('weight') else None,
        symptoms=data.get('symptoms'),
        physical_exam=data.get('physical_exam'),
        recommendations=data.get('recommendations'),
        medications=data.get('medications'),
        notes=data.get('notes'),
        user_id=current_user.id
    )
    
    # Ajouter la date du prochain checkup si fournie
    if data.get('next_checkup_date'):
        checkup.next_checkup_date = datetime.strptime(data.get('next_checkup_date'), '%Y-%m-%d')
    
    # Initialiser patient_id et baby_id à None
    patient_id = None
    baby_id = None
    
    # Associer au patient ou au bébé selon le type
    if checkup_type == 'mother':
        patient_id = int(data.get('patient_id'))
        # Vérifier que le patient appartient au midwife connecté
        patient = Patient.query.filter_by(id=patient_id, user_id=current_user.id).first()
        if not patient:
            return jsonify({'error': 'Patient non trouvé'}), 404
        
        checkup.patient_id = patient_id
        
    elif checkup_type == 'baby':
        baby_id = int(data.get('baby_id'))
        # Vérifier que le bébé appartient à un patient du midwife connecté
        baby = BabyRecord.query.join(Patient).filter(
            BabyRecord.id == baby_id,
            Patient.user_id == current_user.id
        ).first()
        
        if not baby:
            return jsonify({'error': 'Bébé non trouvé'}), 404
        
        checkup.baby_id = baby_id
    
    db.session.add(checkup)
    
    # Journal d'audit
    log_details = ""
    if checkup_type == 'mother':
        log_details = f"Patient ID: {patient_id}"
    else:
        log_details = f"Bébé ID: {baby_id}"
        
    log = AuditLog(
        user_id=current_user.id,
        action=f"Enregistrement de suivi postnatal ({checkup_type})",
        details=log_details,
        ip_address=request.remote_addr
    )
    db.session.add(log)
    
    db.session.commit()
    
    # Créer un rappel automatique pour le prochain checkup si la date est fournie
    if checkup.next_checkup_date:
        reminder = PostnatalCareReminder(
            title=f"Prochain suivi postnatal ({checkup_type})",
            description=f"Suivi postnatal programmé pour {'la mère' if checkup_type == 'mother' else 'le bébé'}",
            reminder_date=checkup.next_checkup_date,
            reminder_type=checkup_type,
            priority="normal",
            user_id=current_user.id
        )
        
        if checkup_type == 'mother':
            reminder.patient_id = patient_id
        else:
            reminder.baby_id = baby_id
        
        db.session.add(reminder)
        db.session.commit()
    
    return jsonify({'success': True, 'checkup_id': checkup.id})
