import React, { useState } from 'react';
import { parseResume } from '../api';

export default function StudentForm({ onSubmit, isLoading }) {
  const [skills, setSkills] = useState('Python, Machine Learning, SQL, Figma');
  const [interests, setInterests] = useState('AI/ML, Data Science, UI/UX Design');
  const [programme, setProgramme] = useState('B.Tech CSE');
  const [year, setYear] = useState('III');
  const [cgpa, setCgpa] = useState('8.2');
  const [maxDurationWeeks, setMaxDurationWeeks] = useState('8');
  const [preferredStartDate, setPreferredStartDate] = useState('15 Sept');
  const [isParsing, setIsParsing] = useState(false);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are supported.');
      return;
    }

    setIsParsing(true);
    try {
      const result = await parseResume(file);
      if (result && result.skills) {
        if (result.skills.length > 0) {
          setSkills(result.skills.join(', '));
          alert(`Extracted ${result.skills.length} skills from your resume!`);
        } else {
          alert('Successfully parsed resume, but no known skills were found. Please list them manually.');
        }
      }
    } catch (err) {
      console.error(err);
      alert(`Error parsing resume: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const loadDemoProfile = (profileType) => {
    switch (profileType) {
      case 'case1': // 0 Eligible Cases
        setSkills('Python');
        setInterests('Data Science');
        setProgramme('B.Tech ME'); // ME has no matches
        setYear('I');
        setCgpa('5.0');
        setMaxDurationWeeks('8');
        setPreferredStartDate('15 Sept');
        break;
      case 'case2': // ML Intern Closed
        setSkills('Python, Machine Learning, SQL, Figma');
        setInterests('AI/ML, Data Science, UI/UX Design');
        setProgramme('B.Tech CSE');
        setYear('III');
        setCgpa('8.2');
        setMaxDurationWeeks('8');
        setPreferredStartDate('15 Sept');
        break;
      case 'case3': // CGPA Constraint Case
        setSkills('Python, Machine Learning, SQL, Figma');
        setInterests('AI/ML, Data Science, UI/UX Design');
        setProgramme('B.Tech CSE');
        setYear('III');
        setCgpa('8.2'); // student has 8.2 (Data Analytics needs 8.5)
        setMaxDurationWeeks('8');
        setPreferredStartDate('15 Sept');
        break;
      case 'case4': // Duration Constraint Case
        setSkills('HTML, CSS, JavaScript, Python, SQL');
        setInterests('Web Development, Data Science');
        setProgramme('B.Tech CSE');
        setYear('III');
        setCgpa('8.2');
        setMaxDurationWeeks('12'); // starts with 12 (Web Dev Intern is 12 weeks and matches)
        setPreferredStartDate('29 Aug');
        break;
      case 'case5': // Start Date Case
        setSkills('Python, Machine Learning, SQL, Figma');
        setInterests('AI/ML, Data Science, UI/UX Design');
        setProgramme('B.Tech CSE');
        setYear('III');
        setCgpa('8.2');
        setMaxDurationWeeks('8');
        setPreferredStartDate('29 Aug'); // Available starting today (29 Aug)
        break;
      default:
        break;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!skills.trim() || !programme.trim() || !year || !cgpa) {
      alert('Please fill in all required fields.');
      return;
    }

    const parsedSkills = skills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const parsedInterests = interests
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const numCgpa = parseFloat(cgpa);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      alert('Please enter a valid CGPA between 0 and 10.');
      return;
    }

    onSubmit({
      skills: parsedSkills,
      interests: parsedInterests,
      programme: programme.trim(),
      year,
      cgpa: numCgpa,
      max_duration_weeks: parseInt(maxDurationWeeks) || 8,
      preferred_start_date: preferredStartDate.trim() || '15 Sept'
    });
  };

  const handleClear = () => {
    setSkills('');
    setInterests('');
    setProgramme('');
    setYear('I');
    setCgpa('');
    setMaxDurationWeeks('8');
    setPreferredStartDate('15 Sept');
  };

  return (
    <form onSubmit={handleSubmit} className="student-form">
      <h3>Enter Student Profile</h3>

      {/* Demo Presets Block */}
      <div className="demo-presets">
        <span className="preset-label">Demo Cases (Quick Load):</span>
        <div className="preset-buttons">
          <button type="button" onClick={() => loadDemoProfile('case1')} className="btn-preset btn-preset-ineligible">
            1️⃣ 0 Eligible Cases
          </button>
          <button type="button" onClick={() => loadDemoProfile('case2')} className="btn-preset btn-preset-ai">
            2️⃣ ML Intern Closed
          </button>
          <button type="button" onClick={() => loadDemoProfile('case3')} className="btn-preset btn-preset-mystery">
            3️⃣ CGPA Constraint
          </button>
          <button type="button" onClick={() => loadDemoProfile('case4')} className="btn-preset btn-preset-web">
            4️⃣ Duration Case (12w vs 8w)
          </button>
          <button type="button" onClick={() => loadDemoProfile('case5')} className="btn-preset btn-preset-mystery">
            5️⃣ Start Date Case (Today vs 1w)
          </button>
        </div>
      </div>

      {/* Resume Upload Box */}
      <div className="resume-upload-container">
        <label htmlFor="resume-upload" className="upload-label">
          📄 Upload Resume (PDF) to Extract Skills
        </label>
        <input 
          type="file" 
          id="resume-upload" 
          accept=".pdf" 
          onChange={handleResumeUpload} 
          disabled={isParsing}
          style={{ display: 'none' }}
        />
        <div 
          className={`upload-box ${isParsing ? 'upload-box-parsing' : ''}`}
          onClick={() => !isParsing && document.getElementById('resume-upload').click()}
        >
          {isParsing ? (
            <div className="parsing-status">
              <div className="spinner-mini"></div>
              <span>Analyzing resume keywords...</span>
            </div>
          ) : (
            <span className="upload-hint">📁 Drag/Click to upload PDF resume</span>
          )}
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="skills">Skills (comma-separated)</label>
        <input
          type="text"
          id="skills"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="e.g. Python, Machine Learning, HTML"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="interests">Areas of Interest (comma-separated)</label>
        <input
          type="text"
          id="interests"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="e.g. AI/ML, Web Development, Cloud Computing"
        />
      </div>

      <div className="form-group">
        <label htmlFor="programme">Programme</label>
        <input
          type="text"
          id="programme"
          value={programme}
          onChange={(e) => setProgramme(e.target.value)}
          placeholder="e.g. B.Tech CSE, M.Tech, BCA"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group col">
          <label htmlFor="year">Year of Study</label>
          <select
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          >
            <option value="I">Year I</option>
            <option value="II">Year II</option>
            <option value="III">Year III</option>
            <option value="IV">Year IV</option>
          </select>
        </div>

        <div className="form-group col">
          <label htmlFor="cgpa">Current CGPA</label>
          <input
            type="number"
            id="cgpa"
            value={cgpa}
            onChange={(e) => setCgpa(e.target.value)}
            placeholder="e.g. 8.5"
            step="0.01"
            min="0"
            max="10"
            required
          />
        </div>
      </div>

      {/* Constraints Fields for Mystery Mission */}
      <div className="form-row">
        <div className="form-group col">
          <label htmlFor="max-duration">Max Duration (Weeks)</label>
          <input
            type="number"
            id="max-duration"
            value={maxDurationWeeks}
            onChange={(e) => setMaxDurationWeeks(e.target.value)}
            placeholder="e.g. 8"
            min="1"
            max="52"
          />
        </div>

        <div className="form-group col">
          <label htmlFor="exams-end">Start Date</label>
          <input
            type="text"
            id="exams-end"
            value={preferredStartDate}
            onChange={(e) => setPreferredStartDate(e.target.value)}
            placeholder="e.g. 15 Sept"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={isLoading} className="btn btn-primary">
          {isLoading ? 'Finding Recommendations...' : 'Find Recommendations'}
        </button>
        <button type="button" onClick={handleClear} disabled={isLoading} className="btn btn-secondary">
          Clear Form
        </button>
      </div>
    </form>
  );
}
