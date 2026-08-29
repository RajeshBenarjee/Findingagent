import React, { useState } from 'react';
import { runWebScraper, importScrapedOpportunities } from '../api';
import { 
  Bot, 
  Globe, 
  Building2, 
  CheckSquare, 
  Square, 
  Play, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Zap,
  Loader2,
  ExternalLink
} from 'lucide-react';

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
      <div className="glass-card scraper-header-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Bot size={24} className="text-cyan" /> Multi-Agent AI Career Scraper
        </h3>
        <p className="scraper-description" style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.4rem', lineHeight: '1.6' }}>
          Select target company portals or scrape a custom careers link. The crawler agents navigate pages, extract openings using Gemini LLM, and compute skill alignment dynamically against your active student profile.
        </p>

        {/* Company Selector Grid Section */}
        <div className="company-selection-section" style={{ marginTop: '1.5rem' }}>
          <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="selection-label" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              Select Portals to Scrape ({selectedCompanies.length}):
            </span>
            <div className="bulk-selection-buttons" style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={handleSelectAll} disabled={isScraping} className="btn-link-action">Select All</button>
              <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
              <button type="button" onClick={handleSelectNone} disabled={isScraping} className="btn-link-action" style={{ color: '#f43f5e' }}>Clear All</button>
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
                  style={{ display: 'none' }}
                />
                {selectedCompanies.includes(company) ? (
                  <CheckSquare size={14} className="text-cyan" />
                ) : (
                  <Square size={14} style={{ color: 'var(--text-subtle)' }} />
                )}
                <span>{company}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom URL Input Field */}
        <div className="custom-url-row" style={{ marginTop: '1.5rem' }}>
          <label htmlFor="custom-url" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            <Globe size={15} style={{ display: 'inline', marginRight: '4px', color: '#38bdf8' }} /> Or scrape a specific Custom Careers page URL:
          </label>
          <input 
            type="url" 
            id="custom-url" 
            placeholder="e.g. https://careers.netflix.com/jobs/intern-engineer" 
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            disabled={isScraping}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(7, 10, 18, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-main)', fontSize: '0.9rem' }}
          />
        </div>

        <div className="scraper-action-row" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn btn-primary btn-scrape-launch" 
            onClick={handleStartScraping}
            disabled={isScraping}
            style={{ width: 'auto', minWidth: '240px' }}
          >
            {isScraping ? (
              <>
                <Loader2 size={18} className="spinner" style={{ width: '18px', height: '18px' }} /> Crawling Portals...
              </>
            ) : (
              <>
                <Play size={18} /> Launch Scraper Agents 🚀
              </>
            )}
          </button>
        </div>
      </div>

      {isScraping && (
        <div className="glass-card loader-container" style={{ margin: '3rem auto', textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem auto' }} />
          <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Multi-Agent crawler in progress...</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>Extracting live job postings via LLM schema parser...</p>
        </div>
      )}

      {!isScraping && (
        <div className="scraped-results-panel">
          <div className="results-header-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.85rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Scraped Opportunities ({scrapedList.length})</h4>
            {scrapedList.length > 0 && (
              <button 
                type="button" 
                className="btn btn-primary btn-import" 
                onClick={handleImportToPool}
                disabled={importing}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', width: 'auto' }}
              >
                {importing ? 'Importing...' : 'Merge to Opportunities Pool 📥'}
              </button>
            )}
          </div>

          {importMessage && (
            <div className="import-success-alert" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#34d399', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> {importMessage}
            </div>
          )}

          <div className="scraped-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {scrapedList.length === 0 ? (
              <div className="glass-card scraped-placeholder-card" style={{ gridColumn: '1 / -1', padding: '5rem 2rem', textAlign: 'center' }}>
                <Bot size={40} className="text-cyan" style={{ margin: '0 auto 1rem auto' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No scraped results yet. Select company portals above and click Launch to extract live internship opportunities.</span>
              </div>
            ) : (
              scrapedList.map((job, idx) => (
                <div key={idx} className="glass-card scraped-job-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="scraped-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.65rem' }}>
                    <div>
                      <h5 className="title" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{job.title}</h5>
                      <span className="scraped-org" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                        <Building2 size={12} /> {job.organization}
                      </span>
                    </div>
                  </div>
                  <div className="scraped-card-details" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ margin: 0 }}><strong>Required Skills:</strong> {job.required_skills.join(', ')}</p>
                    
                    {/* Skills match matching block */}
                    {job.matched_skills && job.matched_skills.length > 0 && (
                      <div className="skill-group-mini">
                        <span className="skill-label-mini text-green-bold" style={{ color: '#34d399' }}>Matched Skills:</span>
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
                        <span className="skill-label-mini text-orange-bold" style={{ color: '#fbbf24' }}>Preferred Skills:</span>
                        <div className="chips-mini">
                          {job.preferred_skills.map((s, i) => (
                            <span key={i} className="chip-mini chip-missing">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p style={{ margin: 0 }}><strong>Duration:</strong> {job.duration} | <strong>Starts:</strong> {job.start_date}</p>
                    <p style={{ margin: 0 }}><strong>Eligibility:</strong> {job.eligibility.programme} ({job.eligibility.years.join(', ')} year) | Min CGPA: {job.eligibility.min_cgpa || 'None'}</p>
                    <p className="scraped-instructions" style={{ margin: 0, fontSize: '0.78rem' }}><strong>Instructions:</strong> {job.application_instructions}</p>
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
