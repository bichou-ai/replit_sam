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
    return render_template('index.html') # THIS IS THE CORRECTED LINE - Servir index.html

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

@app.route('/api/postnatal/babies')
@login_required
def api_babies():
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
