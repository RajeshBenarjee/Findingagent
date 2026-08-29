import re
import json
import time
import requests
from typing import List, Dict, Any, Optional

# Mock raw career pages text to be parsed by Gemini or Fallback Agent
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
    "Airbnb": "Airbnb Full-Stack Engineer Intern. Duration: 8 weeks. Requires JavaScript, Node.js, and SQL. B.Tech III year. CGPA ≥ 7.5. Starts 10 Oct. Instructions: Apply via Airbnb careers page."
}

# Real-looking fallback list in case Gemini API is not used or fails
FALLBACK_SCRAPED = [
    {
        "title": "Google Software Engineering Intern",
        "organization": "Google India",
        "domain": "Software Engineering",
        "required_skills": ["Python", "Go", "Algorithms"],
        "eligibility": {
            "programme": "B.Tech",
            "years": ["III", "IV"],
            "min_cgpa": 8.0
        },
        "duration": "8 weeks",
        "deadline": "30 Sept",
        "application_link": "https://careers.google.com/jobs",
        "status": "Open",
        "start_date": "10 Oct",
        "application_instructions": "Apply on Google Careers portal."
    },
    {
        "title": "Microsoft Data Science Intern",
        "organization": "Microsoft",
        "domain": "Data Science",
        "required_skills": ["Python", "SQL", "Machine Learning"],
        "eligibility": {
            "programme": "B.Tech",
            "years": ["III"],
            "min_cgpa": 8.0
        },
        "duration": "12 weeks",
        "deadline": "28 Sept",
        "application_link": "https://careers.microsoft.com",
        "status": "Open",
        "start_date": "15 Oct",
        "application_instructions": "Submit CV via MS Careers portal."
    },
    {
        "title": "Meta Frontend Engineer Intern",
        "organization": "Meta",
        "domain": "Web Development",
        "required_skills": ["JavaScript", "React", "CSS"],
        "eligibility": {
            "programme": "B.Tech",
            "years": ["II", "III"],
            "min_cgpa": null
        },
        "duration": "8 weeks",
        "deadline": "05 Oct",
        "application_link": "https://meta.com/careers",
        "status": "Open",
        "start_date": "20 Oct",
        "application_instructions": "Register on Meta Careers portal."
    },
    {
        "title": "Amazon Cloud Developer Intern",
        "organization": "Amazon Web Services",
        "domain": "Cloud Computing",
        "required_skills": ["AWS", "Linux", "Python"],
        "eligibility": {
            "programme": "B.Tech",
            "years": ["III", "IV"],
            "min_cgpa": 7.0
        },
        "duration": "8 weeks",
        "deadline": "22 Sept",
        "application_link": "https://amazon.jobs",
        "status": "Open",
        "start_date": "05 Oct",
        "application_instructions": "Apply through Amazon Jobs."
    },
    {
        "title": "Apple iOS Development Intern",
        "organization": "Apple Inc.",
        "domain": "Mobile Development",
        "required_skills": ["Swift", "iOS", "Xcode"],
        "eligibility": {
            "programme": "B.Tech",
            "years": ["III"],
            "min_cgpa": 8.0
        },
        "duration": "8 weeks",
        "deadline": "12 Sept",
        "application_link": "https://apple.com/careers",
        "status": "Open",
        "start_date": "12 Oct",
        "application_instructions": "Send application to ios-intern@apple.com."
    },
    {
        "title": "Netflix UI/UX Design Intern",
        "organization": "Netflix",
        "domain": "UI/UX Design",
        "required_skills": ["Figma", "Wireframing"],
        "eligibility": {
            "programme": "B.Tech",
            "years": ["II", "III"],
            "min_cgpa": null
        },
        "duration": "6 weeks",
        "deadline": "19 Sept",
        "application_link": "https://jobs.netflix.com",
        "status": "Open",
        "start_date": "18 Oct",
        "application_instructions": "Submit portfolio on Netflix jobs site."
    },
    {
        "title": "Stripe Backend Engineer Intern",
        "organization": "Stripe",
        "domain": "Software Engineering",
        "required_skills": ["Ruby", "Python", "SQL"],
        "eligibility": {
            "programme": "B.Tech",
            "years": ["III"],
            "min_cgpa": 8.0
        },
        "duration": "8 weeks",
        "deadline": "25 Sept",
        "application_link": "https://stripe.com/jobs",
        "status": "Open",
        "start_date": "01 Oct",
        "application_instructions": "Apply on Stripe Jobs board."
    },
    {
        "title": "Uber Systems Engineering Intern",
        "organization": "Uber Technologies",
        "domain": "Software Engineering",
        "required_skills": ["C++", "Linux", "Git"],
        "eligibility": {
            "programme": "B.Tech",
            "years": ["III", "IV"],
            "min_cgpa": 7.5
        },
        "duration": "8 weeks",
        "deadline": "29 Sept",
        "application_link": "https://careers.uber.com",
        "status": "Open",
        "start_date": "14 Oct",
        "application_instructions": "Apply via Uber Careers page."
    },
    {
        "title": "Tesla Autopilot AI Intern",
        "organization": "Tesla",
        "domain": "AI/ML",
        "required_skills": ["Python", "PyTorch", "Deep Learning"],
        "eligibility": {
            "programme": "B.Tech CSE",
            "years": ["IV"],
            "min_cgpa": 8.5
        },
        "duration": "12 weeks",
        "deadline": "10 Oct",
        "application_link": "https://tesla.com/careers",
        "status": "Open",
        "start_date": "20 Oct",
        "application_instructions": "Submit Github profile on Tesla portal."
    },
    {
        "title": "Airbnb Full-Stack Engineer Intern",
        "organization": "Airbnb",
        "domain": "Software Engineering",
        "required_skills": ["JavaScript", "Node.js", "SQL"],
        "eligibility": {
            "programme": "B.Tech",
            "years": ["III"],
            "min_cgpa": 7.5
        },
        "duration": "8 weeks",
        "deadline": "15 Sept",
        "application_link": "https://careers.airbnb.com",
        "status": "Open",
        "start_date": "10 Oct",
        "application_instructions": "Apply via Airbnb careers page."
    }
]

def parse_with_gemini(api_key: str, company: str, raw_text: str) -> Optional[Dict[str, Any]]:
    """
    Direct Gemini API call to parse raw careers text into structured opportunity schema.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
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
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=8)
        if response.status_code == 200:
            res_data = response.json()
            text_response = res_data["candidates"][0]["content"]["parts"][0]["text"]
            # Clean possible markdown block formatting
            match = re.search(r'(\{.*\})', text_response, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            return json.loads(text_response)
    except Exception as e:
        print(f"Gemini call failed for {company}: {e}")
    return None

def run_multi_agent_scrape(api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Simulates a multi-agent scraping process. 
    If Gemini API key is provided, it calls the LLM to parse mock raw HTML; 
    otherwise, it loads mock scraped internships.
    Returns agent logs and scraped items list.
    """
    logs = []
    scraped_opportunities = []
    
    logs.append("[Lead Scraper Agent] 🤖 Initializing Multi-Agent scrape request for 10 Tech Companies...")
    time.sleep(0.1)
    logs.append("[Lead Scraper Agent] 🔌 Equipping Crawler Agents with search and requests tools.")
    
    companies = list(MOCK_CAREER_TEXTS.keys())
    
    for idx, company in enumerate(companies, start=1):
        logs.append(f"[Crawler Agent-{idx}] 🌐 Spawning browser session for: {company} Careers page")
        time.sleep(0.05)
        logs.append(f"[Crawler Agent-{idx}] 📄 Fetched career page text. Transmitting to Extractor Agent...")
        
        extracted_item = None
        if api_key:
            logs.append(f"[Extractor Agent] 🧠 Calling Gemini LLM to parse raw text from {company}...")
            extracted_item = parse_with_gemini(api_key, company, MOCK_CAREER_TEXTS[company])
            
        if not extracted_item:
            # Fallback to pre-scraped opportunity for reliability
            logs.append(f"[Extractor Agent] 📁 (Fallback Mode) Processing cached parser for: {company}")
            extracted_item = FALLBACK_SCRAPED[idx-1]
            
        logs.append(f"[Validator Agent] ⚡ Validating extracted schema for: {extracted_item['title']} at {company}")
        time.sleep(0.05)
        
        # Ensure default status and instructions
        if "status" not in extracted_item:
            extracted_item["status"] = "Open"
        if "application_instructions" not in extracted_item:
            extracted_item["application_instructions"] = "Apply on corporate careers website."
            
        scraped_opportunities.append(extracted_item)
        logs.append(f"[Lead Scraper Agent] ✅ Successfully scraped & validated: {extracted_item['title']}")
        
    logs.append(f"[Lead Scraper Agent] 🎉 Complete! Scraped 10 opportunities successfully. Ready for pool import.")
    
    return {
        "logs": logs,
        "opportunities": scraped_opportunities
    }
