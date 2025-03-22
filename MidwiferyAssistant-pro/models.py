from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from app import db
import json

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # User-specific settings
    default_cycle_length = db.Column(db.Integer, default=28)
    
    # Relationships
    patients = db.relationship('Patient', backref='midwife', lazy='dynamic')
    blood_pressure_records = db.relationship('BloodPressureRecord', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(64), nullable=False)
    last_name = db.Column(db.String(64), nullable=False)
    date_of_birth = db.Column(db.Date)
    last_period_date = db.Column(db.Date)
    cycle_length = db.Column(db.Integer, default=28)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    blood_pressure_records = db.relationship('BloodPressureRecord', backref='patient', lazy='dynamic')
    biomedical_records = db.relationship('BiomedicalRecord', backref='patient', lazy='dynamic')
    ultrasound_records = db.relationship('UltrasoundRecord', backref='patient', lazy='dynamic')

    def __repr__(self):
        return f'<Patient {self.first_name} {self.last_name}>'

class BloodPressureRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    systolic = db.Column(db.Integer, nullable=False)
    diastolic = db.Column(db.Integer, nullable=False)
    heart_rate = db.Column(db.Integer)
    notes = db.Column(db.Text)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f'<BloodPressureRecord {self.systolic}/{self.diastolic}>'

class BiomedicalRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    hemoglobin = db.Column(db.Float)
    platelets = db.Column(db.Integer)
    ferritin = db.Column(db.Float)
    hematocrit = db.Column(db.Float)
    ldh = db.Column(db.Float)
    alt = db.Column(db.Float)
    ast = db.Column(db.Float)
    notes = db.Column(db.Text)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)

    def __repr__(self):
        return f'<BiomedicalRecord for patient {self.patient_id}>'

class UltrasoundRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gestational_age = db.Column(db.Integer)  # in weeks
    bpd = db.Column(db.Float)  # Biparietal Diameter
    fl = db.Column(db.Float)   # Femur Length
    ac = db.Column(db.Float)   # Abdominal Circumference
    hc = db.Column(db.Float)   # Head Circumference
    estimated_weight = db.Column(db.Float)  # in grams
    placenta_location = db.Column(db.String(50))
    amniotic_fluid_index = db.Column(db.Float)
    notes = db.Column(db.Text)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)

    def __repr__(self):
        return f'<UltrasoundRecord at {self.gestational_age} weeks>'

class DeliveryRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    delivery_date = db.Column(db.DateTime, nullable=False)
    delivery_type = db.Column(db.String(50), nullable=False)  # 'vaginal', 'cesarean', 'instrumental', etc.
    delivery_location = db.Column(db.String(100), nullable=False)  # Hospital, clinic, home, etc.
    complications = db.Column(db.Text)
    blood_loss = db.Column(db.Integer)  # Estimated in mL
    anesthesia_type = db.Column(db.String(100))
    delivery_duration = db.Column(db.Integer)  # In minutes
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    patient = db.relationship('Patient', backref=db.backref('delivery_records', lazy='dynamic'))
    user = db.relationship('User')
    
    def __repr__(self):
        return f'<DeliveryRecord {self.delivery_type} on {self.delivery_date}>'

class BabyRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(64))
    last_name = db.Column(db.String(64))
    birth_date = db.Column(db.DateTime, nullable=False)
    gender = db.Column(db.String(10))
    birth_weight = db.Column(db.Float, nullable=False)  # in grams
    birth_length = db.Column(db.Float)  # in cm
    head_circumference = db.Column(db.Float)  # in cm
    apgar_1min = db.Column(db.Integer)  # 0-10
    apgar_5min = db.Column(db.Integer)  # 0-10
    apgar_10min = db.Column(db.Integer)  # 0-10
    resuscitation_required = db.Column(db.Boolean, default=False)
    resuscitation_details = db.Column(db.Text)
    oxygen_required = db.Column(db.Boolean, default=False)
    congenital_anomalies = db.Column(db.Text)
    nicu_required = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    mother_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    delivery_id = db.Column(db.Integer, db.ForeignKey('delivery_record.id'), nullable=False)
    
    # Relationships
    mother = db.relationship('Patient', backref=db.backref('baby_records', lazy='dynamic'))
    delivery = db.relationship('DeliveryRecord', backref=db.backref('babies', lazy='dynamic'))
    
    def __repr__(self):
        name = self.first_name or "Baby"
        return f'<BabyRecord {name} born on {self.birth_date}>'

class PostnatalCheckup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    checkup_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    checkup_type = db.Column(db.String(50), nullable=False)  # 'mother' or 'baby'
    temperature = db.Column(db.Float)  # in Celsius
    heart_rate = db.Column(db.Integer)  # BPM
    blood_pressure_systolic = db.Column(db.Integer)
    blood_pressure_diastolic = db.Column(db.Integer)
    respiratory_rate = db.Column(db.Integer)  # breaths per minute
    weight = db.Column(db.Float)  # in kg
    symptoms = db.Column(db.Text)
    physical_exam = db.Column(db.Text)
    recommendations = db.Column(db.Text)
    medications = db.Column(db.Text)
    next_checkup_date = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'))  # for mother
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_record.id'))  # for baby
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    patient = db.relationship('Patient', backref=db.backref('postnatal_checkups', lazy='dynamic'))
    baby = db.relationship('BabyRecord', backref=db.backref('checkups', lazy='dynamic'))
    user = db.relationship('User')
    
    def __repr__(self):
        return f'<PostnatalCheckup for {self.checkup_type} on {self.checkup_date}>'

class VaccinationRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vaccine_name = db.Column(db.String(100), nullable=False)  # BCG, VPO, Vitamin K, etc.
    date_administered = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    dose = db.Column(db.String(50))
    route = db.Column(db.String(50))  # Oral, IM, IV, etc.
    site = db.Column(db.String(50))  # Left arm, right thigh, etc.
    lot_number = db.Column(db.String(50))
    expiration_date = db.Column(db.Date)
    reaction = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_record.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    baby = db.relationship('BabyRecord', backref=db.backref('vaccinations', lazy='dynamic'))
    user = db.relationship('User')
    
    def __repr__(self):
        return f'<VaccinationRecord {self.vaccine_name} for baby {self.baby_id}>'

class BreastfeedingRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    feeding_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    feeding_type = db.Column(db.String(50), nullable=False)  # 'exclusive breastfeeding', 'mixed', 'formula'
    duration = db.Column(db.Integer)  # In minutes
    issues = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    mother_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_record.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    mother = db.relationship('Patient', backref=db.backref('breastfeeding_records', lazy='dynamic'))
    baby = db.relationship('BabyRecord', backref=db.backref('breastfeeding_records', lazy='dynamic'))
    user = db.relationship('User')
    
    def __repr__(self):
        return f'<BreastfeedingRecord for baby {self.baby_id} on {self.feeding_date}>'

class PostnatalCareReminder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    reminder_date = db.Column(db.DateTime, nullable=False)
    reminder_type = db.Column(db.String(50), nullable=False)  # 'mother', 'baby', 'both'
    priority = db.Column(db.String(50), default='normal')  # 'high', 'normal', 'low'
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'))
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_record.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    patient = db.relationship('Patient', backref=db.backref('postnatal_reminders', lazy='dynamic'))
    baby = db.relationship('BabyRecord', backref=db.backref('reminders', lazy='dynamic'))
    user = db.relationship('User')
    
    def __repr__(self):
        return f'<PostnatalCareReminder {self.title} on {self.reminder_date}>'

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.String(128), nullable=False)
    details = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(45))
    
    # Relationship
    user = db.relationship('User', backref='audit_logs')

    def __repr__(self):
        return f'<AuditLog {self.action}>'
