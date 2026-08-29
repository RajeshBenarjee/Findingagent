import React, { useState, useEffect } from 'react';
import StudentForm from './components/StudentForm';
import ResultsList from './components/ResultsList';
import CareerScraper from './components/CareerScraper';
import { getRecommendations } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('finder'); // 'finder' or 'tracker'
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Original form inputs (saved to run simulator overrides)
  const [lastFormInput, setLastFormInput] = useState({
    skills: ["Python", "Machine Learning", "SQL"],
    interests: ["AI/ML", "Data Science"],
    programme: "B.Tech CSE",
    year: "III",
    cgpa: 8.2
  });

  // What-If Simulator States
  const [simulatorActive, setSimulatorActive] = useState(false);
  const [simCgpa, setSimCgpa] = useState(8.2);
  const [simYear, setSimYear] = useState('III');
  const [simSkills, setSimSkills] = useState('Python, Machine Learning, SQL');
  const [simInterests, setSimInterests] = useState('AI/ML, Data Science');

  // Kanban Application Tracker state
  const [trackedApplications, setTrackedApplications] = useState(() => {
    const saved = localStorage.getItem('campus_agent_tracked_applications');
    return saved ? JSON.parse(saved) : [];
  });

  // Save tracked applications to local storage on changes
  useEffect(() => {
    localStorage.setItem('campus_agent_tracked_applications', JSON.stringify(trackedApplications));
  }, [trackedApplications]);

  // Hook to run recommendations when simulator values change
  useEffect(() => {
    if (!simulatorActive) return;

    const triggerSimulatedRecommend = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const parsedSkills = simSkills
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        const parsedInterests = simInterests
          .split(',')
          .map((i) => i.trim())
          .filter((i) => i.length > 0);

        const payload = {
          skills: parsedSkills,
          interests: parsedInterests,
          programme: lastFormInput.programme,
          year: simYear,
          cgpa: parseFloat(simCgpa),
          max_duration_weeks: lastFormInput.max_duration_weeks || 8,
          preferred_start_date: lastFormInput.preferred_start_date || "15 Sept"
        };

        const data = await getRecommendations(payload);
        setResults(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error loading simulated recommendations.');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce simulation requests slightly
    const timer = setTimeout(() => {
      triggerSimulatedRecommend();
    }, 400);

    return () => clearTimeout(timer);
  }, [simCgpa, simYear, simSkills, simInterests, simulatorActive]);

  const handleFormSubmit = async (studentProfile) => {
    setIsLoading(true);
    setError(null);
    setLastFormInput(studentProfile);
    
    // Initialize simulator states to match submitted profile
    setSimCgpa(studentProfile.cgpa);
    setSimYear(studentProfile.year);
    setSimSkills(studentProfile.skills.join(', '));
    setSimInterests(studentProfile.interests.join(', '));

    try {
      const data = await getRecommendations(studentProfile);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while finding recommendations.');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackOpportunity = (job) => {
    const isAlreadyTracked = trackedApplications.some(app => app.title === job.title && app.organization === job.organization);
    if (isAlreadyTracked) {
      alert(`"${job.title}" is already in your application tracker.`);
      return;
    }

    const newApp = {
      id: `${job.title}-${job.organization || 'Cell'}-${Date.now()}`,
      title: job.title,
      organization: job.organization || 'TBD - Placement Cell',
      deadline: job.deadline,
      application_link: job.application_link,
      status: 'Interested',
      addedAt: new Date().toISOString()
    };

    setTrackedApplications(prev => [...prev, newApp]);
    alert(`Added "${job.title}" to your Application Tracker as "Interested"!`);
  };

  const handleUpdateTrackedStatus = (id, newStatus) => {
    setTrackedApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
  };

  const handleRemoveTracked = (id) => {
    if (window.confirm("Are you sure you want to remove this internship from your application tracker?")) {
      setTrackedApplications(prev => prev.filter(app => app.id !== id));
    }
  };

  // Helper lists for Kanban Columns
  const columns = [
    { label: 'Interested 📁', status: 'Interested' },
    { label: 'Applied ✉️', status: 'Applied' },
    { label: 'Interviewing 💬', status: 'Interviewing' },
    { label: 'Offers 🏆', status: 'Offers' }
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Campus Agent 🎓</h1>
          <h2>Internship Opportunity Finder</h2>
          <p>Personalized, deterministic matching combined with demo-ready hackathon utilities.</p>
        </div>

        {/* Tab Navigation Menu */}
        <div className="tabs-navigation">
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'finder' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('finder')}
          >
            🔍 Opportunities Finder
          </button>
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'tracker' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('tracker')}
          >
            📋 Application Tracker ({trackedApplications.length})
          </button>
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'scraper' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('scraper')}
          >
            🤖 AI Career Scraper 🚀
          </button>
        </div>
      </header>

      {activeTab === 'finder' ? (
        <main className="app-main">
          <div className="form-column">
            <StudentForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>
          
          <div className="results-column">
            {/* What-If Simulator Switch Panel */}
            {results && (
              <div className="simulator-toggle-panel">
                <div className="panel-header">
                  <h3>⚡ Real-Time "What-If" Eligibility Simulator</h3>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={simulatorActive}
                      onChange={(e) => setSimulatorActive(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                {simulatorActive && (
                  <div className="simulator-controls">
                    <p className="sim-desc">
                      Slide controls to simulate new parameters. The system re-grades and re-matches jobs immediately in real-time.
                    </p>
                    <div className="sim-grid">
                      <div className="sim-control-group">
                        <label>Simulated CGPA: <strong>{simCgpa}</strong></label>
                        <input 
                          type="range" 
                          min="0" 
                          max="10" 
                          step="0.05"
                          value={simCgpa}
                          onChange={(e) => setSimCgpa(parseFloat(e.target.value))}
                        />
                      </div>

                      <div className="sim-control-group">
                        <label>Simulated Year:</label>
                        <select value={simYear} onChange={(e) => setSimYear(e.target.value)}>
                          <option value="I">Year I</option>
                          <option value="II">Year II</option>
                          <option value="III">Year III</option>
                          <option value="IV">Year IV</option>
                        </select>
                      </div>

                      <div className="sim-control-group full-width">
                        <label>Simulated Skills (comma-separated):</label>
                        <input 
                          type="text" 
                          value={simSkills} 
                          onChange={(e) => setSimSkills(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isLoading && (
              <div className="loader-container">
                <div className="spinner"></div>
                <p>Analyzing dataset & matching requirements...</p>
              </div>
            )}

            {error && (
              <div className="error-alert">
                <strong>Error:</strong> {error}
              </div>
            )}

            {!isLoading && !error && !results && (
              <div className="welcome-placeholder">
                <h3>Ready to find internships?</h3>
                <p>Fill out your details on the left, or upload a PDF resume. We will match your profile against 50 internships.</p>
              </div>
            )}

            {!isLoading && !error && results && (
              <ResultsList results={results} onTrackOpportunity={handleTrackOpportunity} />
            )}
          </div>
        </main>
      ) : activeTab === 'tracker' ? (
        <main className="tracker-main">
          {/* Kanban Tracker Tab Panel */}
          <div className="tracker-header">
            <h3>📋 Personal Application Kanban Board</h3>
            <p>Manage and track the progress of your internship applications. (Data is stored locally in your browser cache).</p>
          </div>

          <div className="kanban-board">
            {columns.map(col => {
              const colApps = trackedApplications.filter(app => app.status === col.status);
              return (
                <div key={col.status} className="kanban-column">
                  <div className="column-header">
                    <h4>{col.label}</h4>
                    <span className="column-count">{colApps.length}</span>
                  </div>
                  
                  <div className="column-body">
                    {colApps.length === 0 ? (
                      <div className="column-empty">Empty Column</div>
                    ) : (
                      colApps.map(app => (
                        <div key={app.id} className="kanban-card">
                          <h5>{app.title}</h5>
                          <p className="card-org">🏢 {app.organization}</p>
                          <p className="card-deadline">📅 Deadline: {app.deadline}</p>
                          
                          {/* Kanban Card Actions */}
                          <div className="kanban-card-actions">
                            <select 
                              value={app.status} 
                              onChange={(e) => handleUpdateTrackedStatus(app.id, e.target.value)}
                              className="kanban-move-select"
                            >
                              <option value="Interested">Move to: Interested</option>
                              <option value="Applied">Move to: Applied</option>
                              <option value="Interviewing">Move to: Interviewing</option>
                              <option value="Offers">Move to: Offers</option>
                            </select>

                            <div className="action-row-mini">
                              {app.application_link && (
                                <a href={app.application_link} target="_blank" rel="noopener noreferrer" className="btn-link-action mini-action">
                                  Apply ↗
                                </a>
                              )}
                              <button 
                                type="button" 
                                className="btn-link-action mini-action action-delete"
                                onClick={() => handleRemoveTracked(app.id)}
                              >
                                Delete ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      ) : (
        <main className="scraper-main" style={{ maxWidth: '1600px', width: '95%', margin: '2.5rem auto', padding: '0 1rem' }}>
          <CareerScraper studentSkills={lastFormInput?.skills || []} />
        </main>
      )}

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Campus Agent - Placement Cell Helper. Built on deterministic matching logic.</p>
      </footer>
    </div>
  );
}
