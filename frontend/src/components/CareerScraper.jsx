import React, { useState, useEffect, useRef } from 'react';
import { runWebScraper, importScrapedOpportunities } from '../api';

export default function CareerScraper() {
  const [apiKey, setApiKey] = useState('');
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

  const handleStartScraping = async () => {
    setIsScraping(true);
    setLogs(["[System] Initializing scraper agents...", "[System] Ready. Initiating network crawling..."]);
    setScrapedList([]);
    setImportMessage('');

    try {
      // Call backend scraper
      const result = await runWebScraper(apiKey);
      
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
      }, 200); // 200ms delay per agent log line

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
          Provide your Gemini API key to parse raw tech company career text, or leave it blank to run in <strong>Simulated Hackathon Demo Mode</strong>. Multiple agents will crawl, parse, and validate career pages, and allow you to merge them directly into your database.
        </p>

        <div className="api-key-row">
          <div className="key-input-group">
            <label htmlFor="gemini-key">Gemini API Key (Optional):</label>
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
            {isScraping ? 'Scraping Page Data...' : 'Launch Multi-Agent Scraper 🚀'}
          </button>
        </div>
      </div>

      <div className="scraper-body-grid">
        {/* Terminal logs console */}
        <div className="scraper-console-column">
          <h4>Agent Terminal Console</h4>
          <div className="terminal-screen">
            {logs.length === 0 ? (
              <span className="terminal-placeholder">Console idle. Launch the agents to view real-time log output...</span>
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
                    <h5>{job.title}</h5>
                    <span className="scraped-org">🏢 {job.organization}</span>
                  </div>
                  <div className="scraped-card-details">
                    <p><strong>Required Skills:</strong> {job.required_skills.join(', ')}</p>
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
