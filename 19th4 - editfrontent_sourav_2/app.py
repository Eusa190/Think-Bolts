from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import json
# --- NEW IMPORTS FOR ML MODEL ---
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

app = Flask(__name__)

# ============ CONFIGURATION ============
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:nandasourav766@localhost/bput12'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'your_super_secret_key_bput'

db = SQLAlchemy(app)

# ============ DATABASE MODELS (Unchanged) ============
class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    mobile = db.Column(db.String(10), nullable=True)
    college = db.Column(db.String(200), nullable=False)
    registration_number = db.Column(db.String(10), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    cgpa = db.Column(db.Float, default=0.0)
    profile_photo = db.Column(db.String(100))
    skills = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    projects = db.relationship('StudentProject', backref='student', lazy=True, cascade='all, delete-orphan')
    applications = db.relationship('JobApplication', backref='student', lazy=True, cascade='all, delete-orphan')

class StudentProject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    project_title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    github_link = db.Column(db.String(500))
    site_link = db.Column(db.String(500))
    youtube_link = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(200), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    logo = db.Column(db.String(100))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    job_postings = db.relationship('JobPosting', backref='company', lazy=True, cascade='all, delete-orphan')

class JobPosting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    job_role = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    required_skills = db.Column(db.Text, nullable=False)
    cgpa_required = db.Column(db.Float, nullable=False)
    location = db.Column(db.String(100), nullable=False) # --- NEW ---
    salary_min = db.Column(db.Float)
    salary_max = db.Column(db.Float)
    contact_email = db.Column(db.String(120))
    contact_mobile = db.Column(db.String(10))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    applications = db.relationship('JobApplication', backref='job_posting', lazy=True, cascade='all, delete-orphan')

class JobApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('job_posting.id'), nullable=False)
    status = db.Column(db.String(20), default='Applied')
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)

class UniversityUser(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CollegeUser(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    college_name = db.Column(db.String(200), nullable=False)
    username = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ============ UTILITY FUNCTIONS (Unchanged) ============
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

BPUT_COLLEGES = [
    "Raajdhani Engineering College, Bhubaneswar",
    "College of Engineering and Technology, Bhubaneswar (CETB)",
    "Indira Gandhi Institute of Technology, Sarang (IGIT)",
    "Silicon Institute of Technology, Bhubaneswar",
    "Trident Academy of Technology, Bhubaneswar",
    "Gandhi Engineering College, Bhubaneswar (GEC)",
    "CV Raman Global University, Bhubaneswar",
    "Orissa Engineering College, Bhubaneswar (OEC)",
]
INDIAN_IT_CITIES = [
    "Bangalore", "Hyderabad", "Pune", "Chennai", "Gurgaon", 
    "Noida", "Mumbai", "Kolkata", "Ahmedabad", "Bhubaneswar", "Kochi"
]

@app.template_filter('fromjson')
def fromjson_filter(value):
    """A template filter to parse a JSON string."""
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return [] # Return an empty list if the value is not a valid JSON string
# -----------------------------
# ============ NEW ML RECOMMENDATION ENGINE ============

def get_recommendations(student_id):
    """
    Generates top 5 job recommendations for a student using a hybrid scoring model.
    - 70% weight on content similarity (TF-IDF & Cosine Similarity).
    - 30% weight on CGPA match.
    """
    student = Student.query.get(student_id)
    if not student:
        return []

    # --- Prepare Data ---
    all_jobs = JobPosting.query.all()
    applied_job_ids = {app.job_id for app in student.applications}
    
    if not all_jobs:
        return []

    # Create student's "document" for TF-IDF
    student_skills = ' '.join(json.loads(student.skills) if student.skills else [])
    student_projects = ' '.join([p.description for p in student.projects if p.description])
    student_doc = f"{student_skills} {student_projects}"

    # Create job "documents"
    job_docs = []
    for job in all_jobs:
        skills = ' '.join(json.loads(job.required_skills) if job.required_skills else [])
        job_doc = f"{job.job_role} {job.description} {skills}"
        job_docs.append(job_doc)

    # --- TF-IDF and Cosine Similarity Calculation ---
    try:
        tfidf_vectorizer = TfidfVectorizer(stop_words='english')
        # Create a single corpus for fitting the vectorizer
        corpus = [student_doc] + job_docs
        tfidf_matrix = tfidf_vectorizer.fit_transform(corpus)
        
        # Calculate cosine similarity between the student (first item) and all jobs
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])
        content_scores = cosine_sim[0]
    except ValueError:
        # Happens if corpus is empty (e.g., student has no skills/projects)
        content_scores = [0] * len(all_jobs)


    # --- Hybrid Scoring ---
    recommendations = []
    for i, job in enumerate(all_jobs):
        if job.id not in applied_job_ids:
            # 1. Content Score (70%)
            content_score = content_scores[i] * 70
            
            # 2. CGPA Score (30%)
            cgpa_score = 0
            if student.cgpa and job.cgpa_required:
                if student.cgpa >= job.cgpa_required:
                    cgpa_score = 30
                else:
                    # Partial score
                    cgpa_score = max(0, (student.cgpa / job.cgpa_required) * 30)

            # Final hybrid score
            total_score = content_score + cgpa_score
            
            # Only recommend jobs with a reasonable score
            if total_score > 25:
                 recommendations.append({'job': job, 'score': round(total_score, 2)})

    # Sort by score and return top 5
    recommendations.sort(key=lambda x: x['score'], reverse=True)
    return recommendations[:5]

# ============ ALL ROUTES (Unchanged from before) ============
# ... (Paste all your routes from the previous version of app.py here)
# The routes themselves do not need to change, because the student_profile
# route already calls the `get_recommendations` function. We have simply
# updated what that function does internally.

# Example of the student_profile route that calls the model:
@app.route('/student_profile')
def student_profile():
    if session.get('role') != 'student':
        flash('Please log in to view this page.', 'error')
        return redirect(url_for('student_login'))
    
    # Get the student and their projects
    student = Student.query.get(session['user_id'])
    projects = StudentProject.query.filter_by(student_id=student.id).all()
    
    # Safely load skills
    try:
        student_skills = json.loads(student.skills) if student.skills else []
    except (json.JSONDecodeError, TypeError):
        student_skills = []

    # This line now calls our recommendation model correctly
    recommendations = get_recommendations(student.id)

    # Pass the data to the template
    return render_template('student_profile.html', 
                           student=student, 
                           projects=projects, 
                           skills=student_skills, 
                           recommendations=recommendations)

# (Make sure to include ALL other routes: register, login, company, etc.)
# ============ ROUTES - LANDING PAGE ============

@app.route('/')
def landing():
    return render_template('landing.html')

# ============ ROUTES - STUDENT ============

@app.route('/student_register', methods=['GET', 'POST'])
def student_register():
    if request.method == 'POST':
        full_name = request.form['full_name']
        email = request.form['email']
       
        college = request.form['college']
        registration_number = request.form['registration_number']
        # 1. Get the plain-text password from the form
        password = request.form['password']
        
        # Validation
        if Student.query.filter_by(email=email).first():
            flash('Email already exists.', 'error')
            return redirect(url_for('student_register'))
        
        if Student.query.filter_by(registration_number=registration_number).first():
            flash('Registration number already exists.', 'error')
            return redirect(url_for('student_register'))
            
        # 2. Hash the password
        hashed_password = generate_password_hash(password)
        
        # 3. Create the new student object, making SURE to assign the hashed password
        new_student = Student(
            full_name=full_name,
            email=email,
          
            college=college,
            registration_number=registration_number,
            password_hash=hashed_password,  # <-- This is the critical line
            skills=json.dumps([]) 
        )
        
        db.session.add(new_student)
        db.session.commit()
        
        # Log the user in immediately after registration
        session['logged_in'] = True
        session['user_id'] = new_student.id
        session['role'] = 'student'
        session['full_name'] = new_student.full_name

        flash('Registration successful! Welcome to your profile.', 'success')
        return redirect(url_for('student_profile'))
    
    return render_template('student_register.html', colleges=BPUT_COLLEGES)

@app.route('/student_login', methods=['GET', 'POST'])
def student_login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        student = Student.query.filter_by(email=email).first()
        
        if student and check_password_hash(student.password_hash, password):
            session['logged_in'] = True
            session['user_id'] = student.id
            session['role'] = 'student'
            session['full_name'] = student.full_name
            flash('Login successful!', 'success')
            return redirect(url_for('student_profile'))
        else:
            flash('Invalid email or password.', 'error')
    
    return render_template('student_login.html')

@app.route('/student_edit_profile', methods=['GET', 'POST'])
def student_edit_profile():
    if session.get('role') != 'student':
        return redirect(url_for('student_login'))
    
    student = Student.query.get(session['user_id'])
    
    if request.method == 'POST':
        student.full_name = request.form['full_name']
        student.email = request.form['email']
        student.mobile = request.form['mobile']
        student.cgpa = float(request.form['cgpa'])
        
        skills_input = request.form.get('skills', '')
        skills_list = [s.strip() for s in skills_input.split(',') if s.strip()]
        student.skills = json.dumps(skills_list)
        
        if 'profile_photo' in request.files:
            file = request.files['profile_photo']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(f"student_{student.id}_{file.filename}")
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                student.profile_photo = filename
        
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('student_profile'))
    
    student_skills_str = ', '.join(json.loads(student.skills)) if student.skills else ""
    return render_template('student_edit_profile.html', student=student, skills=student_skills_str)


@app.route('/add_project', methods=['POST'])
def add_project():
    if session.get('role') != 'student':
        return redirect(url_for('landing'))
    
    if request.method == 'POST':
        project = StudentProject(
            student_id=session['user_id'],
            project_title=request.form['project_title'],
            description=request.form['description'],
            github_link=request.form.get('github_link'),
            site_link=request.form.get('site_link'),
            youtube_link=request.form.get('youtube_link')
        )
        db.session.add(project)
        db.session.commit()
        flash('Project added successfully!', 'success')

    return redirect(url_for('student_edit_profile'))

@app.route('/delete_project/<int:project_id>')
def delete_project(project_id):
    if session.get('role') != 'student':
        return redirect(url_for('landing'))
    
    project = StudentProject.query.get_or_404(project_id)
    if project.student_id != session['user_id']:
        flash('Unauthorized action.', 'error')
        return redirect(url_for('student_profile'))
    
    db.session.delete(project)
    db.session.commit()
    flash('Project deleted!', 'success')
    return redirect(url_for('student_edit_profile'))


@app.route('/all_internship_opportunity')
def all_internship_opportunity():
    if session.get('role') != 'student':
        return redirect(url_for('student_login'))

    selected_location = request.args.get('location')
    page_title = "Browse Job & Internship Opportunities" # Default title
    
    if selected_location:
        # If a location is selected, filter the jobs by that location
        all_jobs = JobPosting.query.filter_by(location=selected_location).order_by(JobPosting.created_at.desc()).all()
        page_title = f"Jobs in {selected_location}"
    else:
        # If no location is selected, show the user's top recommendations
        recommendations = get_recommendations(session['user_id'])
        # Extract just the job objects from the recommendation list
        all_jobs = [rec['job'] for rec in recommendations]
        page_title = "Jobs Recommended For You"

    student = Student.query.get(session['user_id'])
    applied_job_ids = {app.job_id for app in student.applications}
    
    return render_template('all_internship_opportunity.html', 
                           jobs=all_jobs, 
                           applied_job_ids=applied_job_ids,
                           cities=INDIAN_IT_CITIES,
                           selected_location=selected_location,
                           page_title=page_title) # Pass the dynamic title to the template


@app.route('/apply_job/<int:job_id>')
def apply_job(job_id):
    if session.get('role') != 'student':
        return redirect(url_for('student_login'))
    
    existing_application = JobApplication.query.filter_by(
        student_id=session['user_id'], 
        job_id=job_id
    ).first()
    
    if existing_application:
        flash('You have already applied for this job.', 'info')
        return redirect(request.referrer or url_for('all_internship_opportunity'))

    application = JobApplication(student_id=session['user_id'], job_id=job_id)
    db.session.add(application)
    db.session.commit()
    flash('Application submitted successfully!', 'success')
    return redirect(request.referrer or url_for('all_internship_opportunity'))

# ============ ROUTES - COMPANY ============

@app.route('/company_register', methods=['GET', 'POST'])
def company_register():
    if request.method == 'POST':
        company_name = request.form['company_name']
        email = request.form['email']
        password = request.form['password']
        
        if Company.query.filter_by(email=email).first() or Company.query.filter_by(company_name=company_name).first():
            flash('Email or company name already exists.', 'error')
            return redirect(url_for('company_register'))
        
        hashed_password = generate_password_hash(password)
        new_company = Company(company_name=company_name, email=email, password_hash=hashed_password)
        db.session.add(new_company)
        db.session.commit()
        
        session['logged_in'] = True
        session['user_id'] = new_company.id
        session['role'] = 'company'
        session['company_name'] = new_company.company_name

        flash('Registration successful! Welcome.', 'success')
        return redirect(url_for('company_profile'))

    return render_template('company_register.html')

@app.route('/company_login', methods=['GET', 'POST'])
def company_login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        company = Company.query.filter_by(email=email).first()
        
        if company and check_password_hash(company.password_hash, password):
            session['logged_in'] = True
            session['user_id'] = company.id
            session['role'] = 'company'
            session['company_name'] = company.company_name
            flash('Login successful!', 'success')
            return redirect(url_for('company_profile'))
        else:
            flash('Invalid email or password.', 'error')
    
    return render_template('company_login.html')

@app.route('/company_profile')
def company_profile():
    if session.get('role') != 'company':
        return redirect(url_for('company_login'))
    
    company = Company.query.get(session['user_id'])
    jobs = JobPosting.query.filter_by(company_id=company.id).order_by(JobPosting.created_at.desc()).all()
    
    return render_template('company_profile.html', company=company, jobs=jobs)

@app.route('/company_edit_profile', methods=['GET', 'POST'])
def company_edit_profile():
    if session.get('role') != 'company':
        return redirect(url_for('company_login'))
        
    company = Company.query.get(session['user_id'])
    
    if request.method == 'POST':
        company.description = request.form.get('description', '')
        
        if 'logo' in request.files:
            file = request.files['logo']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(f"company_{company.id}_{file.filename}")
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                company.logo = filename
        
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('company_profile'))

    return render_template('company_edit_profile.html', company=company)


@app.route('/post_job', methods=['GET', 'POST'])
def post_job():
    if session.get('role') != 'company':
        return redirect(url_for('company_login'))
        
    if request.method == 'POST':
        skills_input = request.form['required_skills']
        skills_list = [s.strip() for s in skills_input.split(',') if s.strip()]
        
        job = JobPosting(
            company_id=session['user_id'],
            job_role=request.form['job_role'],
            description=request.form.get('description', ''),
            required_skills=json.dumps(skills_list),
            cgpa_required=float(request.form['cgpa_required']),
            location=request.form['location'], # --- NEW ---
            salary_min=float(request.form.get('salary_min', 0) or 0),
            salary_max=float(request.form.get('salary_max', 0) or 0),
            contact_email=request.form.get('contact_email'),
            contact_mobile=request.form.get('contact_mobile')
        )
        
        db.session.add(job)
        db.session.commit()
        flash('Job posted successfully!', 'success')
        return redirect(url_for('company_profile'))

    return render_template('post_job.html',cities=INDIAN_IT_CITIES)

@app.route('/applicants/<int:job_id>')
def applicants(job_id):
    if session.get('role') != 'company':
        return redirect(url_for('company_login'))
    
    job = JobPosting.query.get_or_404(job_id)
    
    if job.company_id != session['user_id']:
        flash('Unauthorized access.', 'error')
        return redirect(url_for('company_profile'))
    
    return render_template('applicants.html', job=job)

@app.route('/view_applicant/<int:student_id>')
def view_applicant(student_id):
    if session.get('role') != 'company':
        return redirect(url_for('company_login'))
        
    student = Student.query.get_or_404(student_id)
    projects = StudentProject.query.filter_by(student_id=student.id).all()
    student_skills = json.loads(student.skills) if student.skills else []
    
    return render_template('view_applicant.html', student=student, projects=projects, skills=student_skills)

# ============ ROUTES - UNIVERSITY ============

@app.route('/university_register', methods=['GET', 'POST'])
def university_register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        role = request.form['role']
        password = request.form['password']

        if UniversityUser.query.filter_by(email=email).first():
            flash('Email already exists.', 'error')
            return redirect(url_for('university_register'))

        hashed_password = generate_password_hash(password)
        new_user = UniversityUser(
            username=username, email=email, role=role, password_hash=hashed_password
        )
        db.session.add(new_user)
        db.session.commit()

        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('university_login'))
    
    return render_template('university_register.html')


@app.route('/university_login', methods=['GET', 'POST'])
def university_login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = UniversityUser.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password_hash, password):
            session['logged_in'] = True
            session['user_id'] = user.id
            session['role'] = 'university'
            session['username'] = user.username
            flash('Login successful!', 'success')
            return redirect(url_for('university_dashboard'))
        else:
            flash('Invalid email or password.', 'error')
    
    return render_template('university_login.html')

@app.route('/university_dashboard')
def university_dashboard():
    if session.get('role') != 'university':
        return redirect(url_for('university_login'))
    
    college_stats = []
    for college in BPUT_COLLEGES:
        students = Student.query.filter_by(college=college).all()
        placed_students_count = db.session.query(JobApplication.student_id).distinct().join(Student).filter(Student.college == college).count()
        college_stats.append({
            'name': college,
            'total_students': len(students),
            'placed_students': placed_students_count
        })

    return render_template('university_dashboard.html', college_stats=college_stats)

# ============ ROUTES - COLLEGE ============

@app.route('/college_register', methods=['GET', 'POST'])
def college_register():
    if request.method == 'POST':
        college_name = request.form['college_name']
        username = request.form['username']
        email = request.form['email']
        role = request.form['role']
        password = request.form['password']

        if CollegeUser.query.filter_by(email=email).first():
            flash('Email already exists.', 'error')
            return redirect(url_for('college_register'))

        hashed_password = generate_password_hash(password)
        new_user = CollegeUser(
            college_name=college_name, username=username, email=email, role=role, password_hash=hashed_password
        )
        db.session.add(new_user)
        db.session.commit()
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('college_login'))
        
    return render_template('college_register.html', colleges=BPUT_COLLEGES)

@app.route('/college_login', methods=['GET', 'POST'])
def college_login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = CollegeUser.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password_hash, password):
            session['logged_in'] = True
            session['user_id'] = user.id
            session['role'] = 'college'
            session['username'] = user.username
            session['college_name'] = user.college_name
            flash('Login successful!', 'success')
            return redirect(url_for('college_dashboard'))
        else:
            flash('Invalid email or password.', 'error')
    
    return render_template('college_login.html')

@app.route('/college_dashboard')
def college_dashboard():
    if session.get('role') != 'college':
        return redirect(url_for('college_login'))
    
    college_name = session['college_name']
    students = Student.query.filter_by(college=college_name).all()
    
    student_data = []
    for student in students:
        applications = JobApplication.query.filter_by(student_id=student.id).all()
        student_data.append({
            'info': student,
            'application_count': len(applications),
            'applications': applications
        })

    return render_template('college_dashboard.html', student_data=student_data, college_name=college_name)

# ============ LOGOUT & ERROR HANDLER ============

@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully.', 'success')
    return redirect(url_for('landing'))

@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404

# ============ APP INITIALIZATION ============

if __name__ == '__main__':
    with app.app_context():
        # db.create_all() # Comment this out after the first run
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)
    
    app.run(debug=True, port=8000)