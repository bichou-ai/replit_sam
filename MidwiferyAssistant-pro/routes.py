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

        # Validate form (add your validation logic here if needed)

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
    # ... (Your dashboard route code - keep it as it is) ...
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
    # ... (Your api_calculate_gestational_age route code - keep it as it is) ...
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
    # ... (Your api_analyze_blood_results route code - keep it as it is) ...
    data = request.json
    hemoglobin = float(data.get('hemoglobin', 0))
    platelets = int(data.get('platelets', 0))
    ferritin = float(data.get('ferritin', 0)) if data.get('ferritin') else None
    hematocrit = float(data.get('hematocrit', 0)) if data.get('hematocrit') else None
    ldh = float(data.get('ldh', 0)) if data.get('ldh') else None
    alt = float(data.get('alt', 0)) if data.get('alt') else None
    ast = float(data.get('ast', 0)) if data.get('ast') else None

    results = analyze_blood_results(hemoglobin, platelets, ferritin, hematocrit, ldh, alt, ast)

    # If patient ID is provided, save the record (keep this part)
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

        # Log the action (keep this part)
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
    # ... (Your blood_pressure route code - keep it as it is) ...
    patients = Patient.query.filter_by(user_id=current_user.id).all()
    return render_template('blood_pressure.html', patients=patients)


@app.route('/api/record_blood_pressure', methods=['POST'])
@login_required
def api_record_blood_pressure():
    # ... (Your api_record_blood_pressure route code - keep it as it is) ...
    data = request.json
    systolic = int(data['systolic'])
    diastolic = int(data['diastolic'])
    heart_rate = int(data.get('heartRate', 0)) if data.get('heartRate') else None
    patient_id = int(data.get('patientId')) if data.get('patientId') else None
    notes = data.get('notes', '')

    result = evaluate_blood_pressure(systolic, diastolic)

    # Record the blood pressure measurement if a patient is selected (keep this part)
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

        # Log the action (keep this part)
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
    # ... (Your patients route code - keep it as it is) ...
    if request.method == 'POST':
        # ... (Your patient creation logic - keep it as it is) ...
        pass # Replace with your actual POST logic
    patients_list = Patient.query.filter_by(user_id=current_user.id).all()
    return render_template('patients.html', patients=patients_list)


@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    # ... (Your profile route code - keep it as it is) ...
    if request.method == 'POST':
        # ... (Your profile update/password change logic - keep it as it is) ...
        pass # Replace with your actual POST logic
    audit_logs = AuditLog.query.filter_by(user_id=current_user.id).order_by(AuditLog.timestamp.desc()).limit(10).all()
    return render_template('profile.html', user=current_user, audit_logs=audit_logs)


# Error handling
@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error='Page non trouvée', message='La page que vous recherchez n\'existe pas.', code=404), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('error.html', error='Erreur serveur', message='Une erreur est survenue sur le serveur.', code=500), 500


# Module de Suivi Postnatal (Keep your postnatal module routes as they are)
@app.route('/postnatal')
@login_required
def postnatal():
    return render_template('postnatal.html')

@app.route('/api/postnatal/babies')
@login_required
def api_babies():
    # ... (Your api_babies route code - keep it as it is) ...
    pass # Replace with your actual API logic

@app.route('/api/postnatal/deliveries')
@login_required
def api_deliveries():
     # ... (Your api_deliveries route code - keep it as it is) ...
    pass # Replace with your actual API logic

# ... (Keep all your other postnatal API routes as they are) ...
