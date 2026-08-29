# Campus Agent — Internship Opportunity Finder

Campus Agent is a full-stack web application designed for students and placement cells to find and match internship opportunities. It evaluates a student's profile (skills, interests, programme, year, CGPA) against a deterministic rule-based matching engine and displays a ranked shortlist of eligible internships with comprehensive reasons, alongside a list of excluded opportunities with reasons for disqualification.

---

## Tech Stack

- **Frontend:** React (Vite, single-page app), custom plain CSS (responsive design)
- **Backend:** Python (FastAPI)
- **Matching Logic:** Plain Python module (deterministic, rule-based matching, no external LLM calls required)
- **Data Store:** In-memory dataset loaded from `data/internships.json`

---

## Folder Structure

```text
campus-agent/
├── backend/
│   ├── main.py              # FastAPI application server
│   ├── agent.py             # Core matching, ranking, and eligibility logic
│   ├── models.py            # Pydantic request and response schemas
│   ├── test_agent.py        # Python unit tests for the agent logic
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Coordinates form inputs and results list state
│   │   ├── components/
│   │   │   ├── StudentForm.jsx  # Input form for student profiles
│   │   │   └── ResultsList.jsx  # Grid cards for eligible positions and ineligible section
│   │   ├── api.js           # API wrapper calling backend endpoints
│   │   └── index.css        # Clean responsive styles
│   ├── package.json         # Node scripts & dependencies
│   └── index.html           # SPA entrypoint
├── data/
│   └── internships.json     # JSON database for internship opportunities
├── README.md
└── .gitignore
```

---

## Setup and Running

### 1. Prerequisites
- Python 3.8+
- Node.js (v16+) and npm

### 2. Run the Backend Server
Navigate to the `backend` directory, create a virtual environment, install dependencies, and start the FastAPI server:

```bash
cd backend
python -m venv .venv

# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run the unit tests to verify matching logic
python test_agent.py

# Start the development server
uvicorn main:app --reload
```
The backend server will start running at `http://127.0.0.1:8000`.

### 3. Run the Frontend Client
Open a new terminal window, navigate to the `frontend` directory, install packages, and start the Vite development server:

```bash
cd frontend
npm install
npm run dev
```
The frontend client will start running at `http://127.0.0.1:5173`. Open this URL in your web browser.

---

## Modifying the Opportunities Dataset

The system parses the internship dataset directly from `data/internships.json`. To add or update opportunities, simply edit `data/internships.json` using the following schema:

```json
{
  "title": "Internship Title",
  "organization": "Company or Placement Cell Name",
  "domain": "Field Area (e.g. AI/ML, Web Development)",
  "required_skills": ["Skill1", "Skill2"],
  "eligibility": {
    "programme": "Programme (e.g. B.Tech)",
    "years": ["III", "IV"],
    "min_cgpa": 7.5
  },
  "duration": "Duration description or null",
  "deadline": "Application deadline description",
  "application_link": "Link url or null"
}
```

The matching server automatically loads the updated file upon startup. If you are running the backend with `--reload`, it will automatically restart and parse the new data files.
