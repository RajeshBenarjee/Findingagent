import json
import os
from models import StudentProfile, InternshipOpportunity
from agent import get_recommendations

def test_recommendation_logic():
    # Load seed data
    json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'internships.json')
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    internships = [InternshipOpportunity(**item) for item in data]
    
    # Test example profile
    student = StudentProfile(
        skills=["Python", "Machine Learning", "SQL"],
        interests=["AI/ML", "Data Science"],
        programme="B.Tech CSE",
        year="III",
        cgpa=8.2
    )
    
    res = get_recommendations(student, internships)
    
    print("--- Test Recommendation Logic ---")
    print("Ranked recommendations:")
    for r in res.ranked:
        print(f"Rank {r.rank}: {r.title} ({r.match_level}) - Reason: {r.reason}")
    
    print("\nNot Eligible recommendations:")
    for n in res.not_eligible:
        print(f"Title: {n.title} - Reason: {n.reason}")
        
    print("\nTop Recommendation:")
    if res.top_recommendation:
        print(f"Title: {res.top_recommendation.title}")
        print(f"Why: {res.top_recommendation.why_recommended}")
    else:
        print("None")
        
    # Assertions
    assert len(res.ranked) >= 2, f"Expected at least 2 ranked, got {len(res.ranked)}"
    assert res.ranked[0].title == "ML Intern", f"Rank #1 should be ML Intern, got {res.ranked[0].title}"
    assert res.ranked[0].match_level == "High", "ML Intern match level should be High"
    
    # Cloud Intern and Web Developer Intern should be in not_eligible
    not_eligible_titles = [n.title for n in res.not_eligible]
    assert "Cloud Intern" in not_eligible_titles, "Cloud Intern should be not eligible"
    assert "Web Developer Intern" in not_eligible_titles, "Web Developer Intern should be not eligible"
    
    print("\nALL TESTS PASSED!")

if __name__ == '__main__':
    test_recommendation_logic()
