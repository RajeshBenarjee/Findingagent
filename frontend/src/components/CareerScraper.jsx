import React, { useState, useEffect, useRef } from 'react';
import { runWebScraper, importScrapedOpportunities } from '../api';

const COMPANIES = [
  "Google", "Microsoft", "Meta", "Amazon", "Apple",
  "Netflix", "Stripe", "Uber", "Tesla", "Airbnb",
  "Nvidia", "Oracle", "Adobe", "Salesforce", "Intel",
  "Spotify", "X (Twitter)", "LinkedIn", "Zoom", "Coinbase"
];

export default function CareerScraper({ studentSkills }) {
  const [apiKey, setApiKey] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState(["Google", "Microsoft", "Meta", "Amazon"]);
  const [customUrl, setCustomUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [logs, setLogs] = useState([]);
  const [scrapedList, setScrapedList] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  
  const terminalEndRef = useRef(null);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleToggleCompany = (company) => {
    if (selectedCompanies.includes(company)) {
      setSelectedCompanies(prev => prev.filter(c => c !== company));
    } else {
      setSelectedCompanies(prev => [...prev, company]);
    }
  };

  const handleSelectAll = () => {
    setSelectedCompanies(COMPANIES);
  };

  const handleSelectNone = () => {
    setSelectedCompanies([]);
  };

  const handleStartScraping = async () => {
    if (selectedCompanies.length === 0 && !customUrl.trim()) {
      alert("Please select at least one company or provide a custom career URL to scrape.");
      return;
    }

    setIsScraping(true);
    setLogs(["[System] Spawning crawler agents...", "[System] Loading configuration parameters..."]);
    setScrapedList([]);
    setImportMessage('');

    try {
      // Call backend scraper sending selected companies list, custom url, and current student profile skills
      const result = await runWebScraper(selectedCompanies, customUrl, studentSkills, apiKey);
      
      // Stream logs in real-time for presentation effect
      let currentLogIndex = 0;
      const interval = setInterval(() => {
        if (currentLogIndex < result.logs.length) {
          setLogs(prev => [...prev, result.logs[currentLogIndex]]);
          currentLogIndex++;
        } else {
          clearInterval(interval);
          setScrapedList(result.opportunities);
          setIsScraping(false);
        }
      }, 150); // 150ms delay per agent log line

    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, `[Fatal Error] Scrape failed: ${err.message}`]);
      setIsScraping(false);
    }
  };

  const handleImportToPool = async () => {
    if (scrapedList.length === 0) return;
    setImporting(true);
    setImportMessage('');
    try {
      const res = await importScrapedOpportunities(scrapedList);
      setImportMessage(res.message);
      alert(res.message);
    } catch (err) {
      console.error(err);
      setImportMessage(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="scraper-tab-container">
      <div className="scraper-header-panel">
        <h3>🤖 Multi-Agent AI Career Scraper</h3>
        <p className="scraper-description">
          Select target company portals or scrape a custom careers link. The crawler agents will navigate the pages, extract openings using the Gemini LLM (via `.env` key or manual override), and compute skill alignment dynamically against your active student profile.
        </p>

        {/* Company Selector Grid Section */}
        <div className="company-selection-section">
          <div className="section-header-row">
            <span className="selection-label">Select Company Portals to Scrape ({selectedCompanies.length}):</span>
            <div className="bulk-selection-buttons">
              <button type="button" onClick={handleSelectAll} disabled={isScraping} className="btn-link-action text-blue">Select All</button>
              <span className="divider">|</span>
              <button type="button" onClick={handleSelectNone} disabled={isScraping} className="btn-link-action text-red">Clear All</button>
            </div>
          </div>
          <div className="company-selection-grid">
            {COMPANIES.map(company => (
              <label key={company} className={`company-checkbox-item ${selectedCompanies.includes(company) ? 'checkbox-active' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={selectedCompanies.includes(company)}
                  onChange={() => handleToggleCompany(company)}
                  disabled={isScraping}
                />
                <span>{company}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom URL Input Field */}
        <div className="custom-url-row">
          <label htmlFor="custom-url">Or scrape a specific Custom Careers page URL:</label>
          <input 
            type="url" 
            id="custom-url" 
            placeholder="e.g. https://careers.netflix.com/jobs/intern-engineer" 
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            disabled={isScraping}
          />
        </div>

        <div className="api-key-row">
          <div className="key-input-group">
            <label htmlFor="gemini-key">Gemini API Key override (Optional - Leave blank to use key in .env or cached demo):</label>
            <input 
              type="password" 
              id="gemini-key" 
              placeholder="AIzaSy..." 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isScraping}
            />
          </div>
          <button 
            type="button" 
            className="btn btn-primary btn-scrape-launch" 
            onClick={handleStartScraping}
            disabled={isScraping}
          >
            {isScraping ? 'Agents Crawling Page Portals...' : 'Launch Scraper Agents 🚀'}
          </button>
        </div>
      </div>

      <div className="scraper-body-grid">
        {/* Terminal logs console */}
        <div className="scraper-console-column">
          <h4>Agent Terminal Console</h4>
          <div className="terminal-screen">
            {logs.length === 0 ? (
              <span className="terminal-placeholder">Console idle. Select company portals and click Launch to view real-time multi-agent activity log.</span>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="terminal-line">
                  <span className="terminal-time">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Scraped Opportunities results list */}
        <div className="scraped-results-column">
          <div className="results-header-row">
            <h4>Scraped Opportunities ({scrapedList.length})</h4>
            {scrapedList.length > 0 && (
              <button 
                type="button" 
                className="btn btn-primary btn-import" 
                onClick={handleImportToPool}
                disabled={importing}
              >
                {importing ? 'Importing...' : 'Merge to Opportunities Pool 📥'}
              </button>
            )}
          </div>

          {importMessage && (
            <div className="import-success-alert">
              🎉 {importMessage}
            </div>
          )}

          <div className="scraped-cards-container">
            {scrapedList.length === 0 ? (
              <div className="scraped-placeholder-card">
                <span>No scraped results yet. Launch the agents above to extract live internship opportunities.</span>
              </div>
            ) : (
              scrapedList.map((job, idx) => (
                <div key={idx} className="scraped-job-card">
                  <div className="scraped-card-header">
                    <div>
                      <h5 className="title">{job.title}</h5>
                      <span className="scraped-org">🏢 {job.organization}</span>
                    </div>
                  </div>
                  <div className="scraped-card-details">
                    <p><strong>Required Skills:</strong> {job.required_skills.join(', ')}</p>
                    
                    {/* Skills match matching block */}
                    {job.matched_skills && job.matched_skills.length > 0 && (
                      <div className="skill-group-mini">
                        <span className="skill-label-mini text-green-bold">Matched Skills:</span>
                        <div className="chips-mini">
                          {job.matched_skills.map((s, i) => (
                            <span key={i} className="chip-mini chip-matched">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Skills preferred matching block */}
                    {job.preferred_skills && job.preferred_skills.length > 0 && (
                      <div className="skill-group-mini">
                        <span className="skill-label-mini text-orange-bold">Preferred Skills:</span>
                        <div className="chips-mini">
                          {job.preferred_skills.map((s, i) => (
                            <span key={i} className="chip-mini chip-missing">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p><strong>Duration:</strong> {job.duration} | <strong>Starts:</strong> {job.start_date}</p>
                    <p><strong>Eligibility:</strong> {job.eligibility.programme} ({job.eligibility.years.join(', ')} year) | Min CGPA: {job.eligibility.min_cgpa || 'None'}</p>
                    <p className="scraped-instructions"><strong>Instructions:</strong> {job.application_instructions}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
