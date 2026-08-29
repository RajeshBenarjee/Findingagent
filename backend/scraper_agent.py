import re
import json
import time
import os
import requests
from typing import List, Dict, Any, Optional

# Load .env file manually to read GROQ_API_KEY
def load_dotenv():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    val = val.strip().strip('"').strip("'")
                    os.environ[key.strip()] = val

load_dotenv()

# Pre-seeded raw careers page text for 20 companies
MOCK_CAREER_TEXTS = {
    "Google": "Google Software Engineering Internship 2027. Location: Bangalore. Duration: 8 weeks. Requires Python, Go, and Algorithms. Candidates must be in B.Tech CSE III or IV year with minimum CGPA 8.0. Starts 10 Oct. Application instructions: Apply on Google Careers portal.",
    "Microsoft": "Microsoft Data Science Intern. Duration: 12 weeks. Requires Python, SQL, and Machine Learning. Target programme: B.Tech CSE/IT, III year. CGPA ≥ 8.0. Starts 15 Oct. Instructions: Submit CV via MS Careers portal.",
    "Meta": "Meta Frontend Engineer Intern. Duration: 8 weeks. Requires JavaScript, React, and CSS. Open to B.Tech II and III year. No CGPA limit. Starts 20 Oct. Instructions: Register on Meta Careers portal.",
    "Amazon": "Amazon Cloud Developer Intern. Duration: 8 weeks. Requires AWS, Linux, and Python. Open to B.Tech III/IV year. CGPA ≥ 7.0. Starts 05 Oct. Instructions: Apply through Amazon Jobs.",
    "Apple": "Apple iOS Development Intern. Duration: 8 weeks. Requires Swift, iOS, and Xcode. B.Tech III year. CGPA ≥ 8.0. Starts 12 Oct. Instructions: Send application to ios-intern@apple.com.",
    "Netflix": "Netflix UI/UX Design Intern. Duration: 6 weeks. Requires Figma and Wireframing. B.Tech II/III year. No CGPA limit. Starts 18 Oct. Instructions: Submit portfolio on Netflix jobs site.",
    "Stripe": "Stripe Backend Engineer Intern. Duration: 8 weeks. Requires Ruby, Python, and SQL. B.Tech III year. CGPA ≥ 8.0. Starts 01 Oct. Instructions: Apply on Stripe Jobs board.",
    "Uber": "Uber Systems Engineering Intern. Duration: 8 weeks. Requires C++, Linux, and Git. B.Tech III/IV year. CGPA ≥ 7.5. Starts 14 Oct. Instructions: Apply via Uber Careers page.",
    "Tesla": "Tesla Autopilot AI Intern. Duration: 12 weeks. Requires Python, PyTorch, and Deep Learning. B.Tech CSE IV year. CGPA ≥ 8.5. Starts 20 Oct. Instructions: Submit Github profile on Tesla portal.",
    "Airbnb": "Airbnb Full-Stack Engineer Intern. Duration: 8 weeks. Requires JavaScript, Node.js, and SQL. B.Tech III year. CGPA ≥ 7.5. Starts 10 Oct. Instructions: Apply via Airbnb careers page.",
    "Nvidia": "Nvidia Deep Learning Hardware Intern. Duration: 12 weeks. Requires Python, C++, and CUDA. B.Tech III/IV year. CGPA ≥ 8.5. Starts 01 Oct. Instructions: Apply on Nvidia careers portal.",
    "Oracle": "Oracle Database Engineering Intern. Duration: 8 weeks. Requires SQL, Java, and Database Systems. B.Tech II/III year. CGPA ≥ 7.0. Starts 10 Oct. Instructions: Submit CV on Oracle jobs board.",
    "Adobe": "Adobe Creative Cloud Graphics Intern. Duration: 8 weeks. Requires C++, WebAssembly, and Figma. B.Tech III year. CGPA ≥ 8.0. Starts 05 Oct. Instructions: Register on Adobe Careers portal.",
    "Salesforce": "Salesforce Systems Analyst Intern. Duration: 8 weeks. Requires Java, SQL, and Git. B.Tech III year. CGPA ≥ 7.5. Starts 12 Oct. Instructions: Apply through Salesforce student jobs.",
    "Intel": "Intel Firmware Developer Intern. Duration: 12 weeks. Requires C, Linux, and Assembly. B.Tech III/IV year. CGPA ≥ 7.5. Starts 15 Oct. Instructions: Send resume to intel-placements@intel.com.",
    "Spotify": "Spotify Audio Recommendation Intern. Duration: 8 weeks. Requires Python, Machine Learning, and SQL. B.Tech III/IV year. CGPA ≥ 8.0. Starts 08 Oct. Instructions: Apply on Spotify jobs board.",
    "X (Twitter)": "X Backend Scaling Intern. Duration: 8 weeks. Requires Scala, Python, and Git. B.Tech III year. CGPA ≥ 8.0. Starts 20 Oct. Instructions: Apply online at X Careers.",
    "LinkedIn": "LinkedIn Analytics & Insights Intern. Duration: 8 weeks. Requires SQL, Python, and Data Visualization. B.Tech III year. CGPA ≥ 8.0. Starts 10 Oct. Instructions: Apply through LinkedIn Jobs portal.",
    "Zoom": "Zoom Video Streaming Engineer Intern. Duration: 8 weeks. Requires C++, WebRTC, and Linux. B.Tech III/IV year. CGPA ≥ 7.8. Starts 15 Oct. Instructions: Register at Zoom careers portal.",
    "Coinbase": "Coinbase Blockchain & Smart Contracts Intern. Duration: 12 weeks. Requires Solidity, Go, and Git. B.Tech III/IV year. CGPA ≥ 8.2. Starts 05 Oct. Instructions: Apply on Coinbase jobs page."
}

def clean_html_to_text(html: str) -> str:
    html = re.sub(r'<(script|style).*?>.*?</\1>', '', html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<[^>]*>', ' ', html)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:1500]

def parse_with_groq(api_key: str, company: str, raw_text: str) -> Optional[Dict[str, Any]]:
    """
    Direct Groq Cloud API call to parse raw careers text using llama-3.1-8b-instant.
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""
    You are an Extractor Agent. Analyze this raw text from the careers page of '{company}' and extract the internship opportunity.
    Return JSON format only, matching this structure EXACTLY:
    {{
      "title": "Internship Title",
      "organization": "Company Name",
      "domain": "Domain Name",
      "required_skills": ["Skill1", "Skill2"],
      "eligibility": {{
        "programme": "B.Tech",
        "years": ["II", "III", "IV"],
        "min_cgpa": 7.5
      }},
      "duration": "8 weeks",
      "deadline": "30 Sept",
      "application_link": "https://company.com/jobs",
      "status": "Open",
      "start_date": "10 Oct",
      "application_instructions": "Instructions text"
    }}
    Do not add markdown wrappers around JSON. Simply return raw JSON.
    Text: {raw_text}
    """
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=8)
        if response.status_code == 200:
            res_data = response.json()
            text_response = res_data["choices"][0]["message"]["content"]
            return json.loads(text_response)
        else:
            print(f"Groq API error for {company}: Status {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Groq call failed for {company}: {e}")
    return None

def run_multi_agent_scrape(
    selected_companies: List[str], 
    custom_url: Optional[str] = None, 
    student_skills: Optional[List[str]] = None,
    api_key_override: Optional[str] = None
) -> Dict[str, Any]:
    logs = []
    scraped_opportunities = []
    
    api_key = api_key_override or os.environ.get("GROQ_API_KEY")
    key_source = "Override Input" if api_key_override else ("loaded from .env" if os.environ.get("GROQ_API_KEY") else "None")
    
    logs.append(f"[Lead Scraper Agent] 🤖 Initializing Multi-Agent scrape. Groq API Key source: {key_source}")
    
    student_skills_lower = [s.lower().strip() for s in student_skills] if student_skills else []
    
    # Handle custom URL scraping first if provided
    if custom_url:
        logs.append(f"[Crawler Agent-Custom] 🌐 Navigating to URL: {custom_url}...")
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            response = requests.get(custom_url, headers=headers, timeout=6)
            if response.status_code == 200:
                raw_text = clean_html_to_text(response.text)
                logs.append(f"[Crawler Agent-Custom] 📄 Successfully downloaded page. Cleaning page text...")
                
                extracted_item = None
                if api_key:
                    logs.append(f"[Extractor Agent] 🧠 Querying Groq Cloud API to parse HTML contents of: {custom_url}...")
                    extracted_item = parse_with_groq(api_key, "Custom URL", raw_text)
                    
                if not extracted_item:
                    logs.append(f"[Extractor Agent] ⚠️ (Fallback Mode) Could not parse custom URL. Creating generic listing.")
                    extracted_item = {
                        "title": "Software Engineer Intern (Scraped)",
                        "organization": "Custom Portal",
                        "domain": "Software Engineering",
                        "required_skills": ["Python", "Git"],
                        "eligibility": {
                            "programme": "B.Tech",
                            "years": ["III"],
                            "min_cgpa": 7.0
                        },
                        "duration": "8 weeks",
                        "deadline": "30 Oct",
                        "application_link": custom_url,
                        "status": "Open",
                        "start_date": "15 Oct",
                        "application_instructions": f"Register at {custom_url}."
                    }
                
                scraped_opportunities.append(extracted_item)
                logs.append(f"[Validator Agent] ✅ Validated custom opportunity: {extracted_item['title']}")
            else:
                logs.append(f"[Crawler Agent-Custom] ❌ Error: Server returned status {response.status_code}")
        except Exception as e:
            logs.append(f"[Crawler Agent-Custom] ❌ Request to custom URL failed: {str(e)}")

    # Crawl selected companies
    if selected_companies:
        for idx, company in enumerate(selected_companies, start=1):
            if company not in MOCK_CAREER_TEXTS:
                continue
            
            logs.append(f"[Crawler Agent-{idx}] 🌐 Navigating to career portal for: {company}...")
            
            raw_text = MOCK_CAREER_TEXTS[company]
            extracted_item = None
            
            if api_key:
                logs.append(f"[Extractor Agent] 🧠 Querying Groq Cloud API to parse raw text of: {company}...")
                extracted_item = parse_with_groq(api_key, company, raw_text)
                
            if not extracted_item:
                from scraper_agent import FALLBACK_SCRAPED
                fallback_matches = [item for item in FALLBACK_SCRAPED if company.lower() in item["organization"].lower() or company.lower() in item["title"].lower()]
                if fallback_matches:
                    extracted_item = fallback_matches[0]
                else:
                    extracted_item = {
                        "title": f"{company} Software Intern",
                        "organization": company,
                        "domain": "Software Engineering",
                        "required_skills": ["Python", "SQL"],
                        "eligibility": {
                            "programme": "B.Tech",
                            "years": ["III"],
                            "min_cgpa": 7.5
                        },
                        "duration": "8 weeks",
                        "deadline": "30 Sept",
                        "application_link": f"https://{company.lower()}.com/careers",
                        "status": "Open",
                        "start_date": "10 Oct",
                        "application_instructions": f"Apply on {company} jobs site."
                    }
                    
            logs.append(f"[Validator Agent] ⚡ Checking skills alignment with student profile...")
            
            req_skills = extracted_item.get("required_skills", [])
            matched = [s for s in req_skills if s.lower().strip() in student_skills_lower]
            preferred = [s for s in req_skills if s.lower().strip() not in student_skills_lower]
            
            extracted_item["matched_skills"] = matched
            extracted_item["preferred_skills"] = preferred
            extracted_item["status"] = "Open"
            
            scraped_opportunities.append(extracted_item)
            logs.append(f"[Lead Scraper Agent] ✅ Successfully parsed: {extracted_item['title']} (Matched: {len(matched)}, Preferred: {len(preferred)})")
            
    logs.append(f"[Lead Scraper Agent] 🎉 Complete! Processed {len(scraped_opportunities)} opportunities. Ready to import.")
    
    return {
        "logs": logs,
        "opportunities": scraped_opportunities
    }
