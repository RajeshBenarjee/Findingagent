import React, { useState } from 'react';
import { runWebScraper, importScrapedOpportunities } from '../api';

const COMPANIES = [
  "Google", "Microsoft", "Meta", "Amazon", "Apple",
  "Netflix", "Stripe", "Uber", "Tesla", "Airbnb",
  "Nvidia", "Oracle", "Adobe", "Salesforce", "Intel",
  "Spotify", "X (Twitter)", "LinkedIn", "Zoom", "Coinbase"
];

export default function CareerScraper({ studentSkills }) {
  const [selectedCompanies, setSelectedCompanies] = useState(["Google", "Microsoft", "Meta", "Amazon"]);
  const [customUrl, setCustomUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedList, setScrapedList] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

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
    setScrapedList([]);
    setImportMessage('');

    try {
      // Call backend scraper sending selected companies list, custom url, and current student profile skills
      // API Key is loaded automatically from backend .env
      const result = await runWebScraper(selectedCompanies, customUrl, studentSkills, null);
      
      if (result && result.opportunities) {
        setScrapedList(result.opportunities);
      }
    } catch (err) {
      console.error(err);
      alert(`Scraping failed: ${err.message}`);
    } finally {
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
          Select target company portals or scrape a custom careers link. The crawler agents will navigate the pages, extract openings using the Gemini LLM (configured in your backend <code>.env</code> file), and compute skill alignment dynamically against your active student profile.
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

        <div className="scraper-action-row" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn btn-primary btn-scrape-launch" 
            onClick={handleStartScraping}
            disabled={isScraping}
            style={{ width: 'auto', minWidth: '220px' }}
          >
            {isScraping ? 'Scraping Portals...' : 'Launch Scraper Agents 🚀'}
          </button>
        </div>
      </div>

      {isScraping && (
        <div className="loader-container" style={{ margin: '3rem auto', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', fontWeight: '700', color: '#1e3a8a' }}>Multi-Agent scraper actively crawling pages and parsing job requirements...</p>
        </div>
      )}

      {!isScraping && (
        <div className="scraped-results-panel">
          <div className="results-header-row" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>Scraped Opportunities ({scrapedList.length})</h4>
            {scrapedList.length > 0 && (
              <button 
                type="button" 
                className="btn btn-primary btn-import" 
                onClick={handleImportToPool}
                disabled={importing}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                {importing ? 'Importing...' : 'Merge to Opportunities Pool 📥'}
              </button>
            )}
          </div>

          {importMessage && (
            <div className="import-success-alert" style={{ marginBottom: '1.5rem' }}>
              🎉 {importMessage}
            </div>
          )}

          <div className="scraped-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {scrapedList.length === 0 ? (
              <div className="scraped-placeholder-card" style={{ gridColumn: '1 / -1', padding: '5rem 2rem' }}>
                <span>No scraped results yet. Select company portals above and click Launch to extract live internship opportunities.</span>
              </div>
            ) : (
              scrapedList.map((job, idx) => (
                <div key={idx} className="scraped-job-card" style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div className="scraped-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <h5 className="title" style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>{job.title}</h5>
                      <span className="scraped-org" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563eb' }}>🏢 {job.organization}</span>
                    </div>
                  </div>
                  <div className="scraped-card-details" style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ margin: 0 }}><strong>Required Skills:</strong> {job.required_skills.join(', ')}</p>
                    
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

                    <p style={{ margin: 0 }}><strong>Duration:</strong> {job.duration} | <strong>Starts:</strong> {job.start_date}</p>
                    <p style={{ margin: 0 }}><strong>Eligibility:</strong> {job.eligibility.programme} ({job.eligibility.years.join(', ')} year) | Min CGPA: {job.eligibility.min_cgpa || 'None'}</p>
                    <p className="scraped-instructions" style={{ margin: 0 }}><strong>Instructions:</strong> {job.application_instructions}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
