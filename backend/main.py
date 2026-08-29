import json
import os
from typing import List
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from models import StudentProfile, InternshipOpportunity, RecommendationResponse, EmailAlertRequest
from agent import get_recommendations

app = FastAPI(title="Campus Agent - Internship Opportunity Finder")

# Enable CORS for the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load internships from the JSON data file
INTERNSHIPS_DATA: List[InternshipOpportunity] = []

@app.on_event("startup")
def load_internships():
    global INTERNSHIPS_DATA
    # Construct the path to data/internships.json
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "..", "data", "internships.json")
    
    if not os.path.exists(json_path):
        # Fallback if run from a different CWD or relative structure
        json_path = os.path.abspath(os.path.join("data", "internships.json"))
        
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
            INTERNSHIPS_DATA = [InternshipOpportunity(**item) for item in raw_data]
            print(f"Loaded {len(INTERNSHIPS_DATA)} internship opportunities successfully.")
    except Exception as e:
        print(f"Error loading internships data: {e}")
        raise RuntimeError(f"Could not load internships.json: {e}")

@app.post("/api/recommend", response_model=RecommendationResponse)
def recommend_internships(student: StudentProfile):
    if not INTERNSHIPS_DATA:
        raise HTTPException(status_code=500, detail="Internship opportunities data is not loaded.")
    
    try:
        response = get_recommendations(student, INTERNSHIPS_DATA)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing recommendations: {str(e)}")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "loaded_items": len(INTERNSHIPS_DATA)}

# List of common tech skills to detect in resume text
SKILL_KEYWORDS = [
    "Python", "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow",
    "SQL", "HTML", "CSS", "JavaScript", "React", "Node.js", "Express",
    "AWS", "Linux", "Docker", "Kubernetes", "Git", "Java", "Kotlin", "Swift",
    "Figma", "Adobe XD", "PowerBI", "Tableau", "Excel", "C#", "C++", "Go",
    "MongoDB", "GraphQL", "Transformers", "NLP", "D3.js", "OpenCV",
    "Wireshark", "Network Security", "Cryptography", "Metasploit", "Product Strategy",
    "R", "Spark", "Hadoop", "Vue", "Angular", "Flutter", "Dart", "Terraform", "C"
]

@app.post("/api/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    from io import BytesIO
    from pypdf import PdfReader
    import re
    
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported.")
    
    try:
        content = await file.read()
        reader = PdfReader(BytesIO(content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
            
        text_lower = text.lower()
        
        extracted_skills = []
        for skill in SKILL_KEYWORDS:
            skill_lower = skill.lower()
            if skill_lower == "c":
                if re.search(r'\b[cC]\b', text):
                    extracted_skills.append(skill)
            elif skill_lower == "r":
                if re.search(r'\b[rR]\b', text):
                    extracted_skills.append(skill)
            elif skill_lower == "go":
                if re.search(r'\b[gG]o\b', text):
                    extracted_skills.append(skill)
            elif skill_lower in text_lower:
                extracted_skills.append(skill)
                
        return {"skills": extracted_skills, "parsed_text_length": len(text)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF resume: {str(e)}")

@app.post("/api/alert")
def trigger_email_alert(payload: EmailAlertRequest):
    from alerts import send_deadline_alert
    try:
        res = send_deadline_alert(
            recipient_email=payload.email,
            job_title=payload.title,
            deadline=payload.deadline,
            organization=payload.organization
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger email alert: {str(e)}")

