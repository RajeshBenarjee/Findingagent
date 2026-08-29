from typing import List, Dict, Any, Tuple
from models import (
    StudentProfile,
    InternshipOpportunity,
    RankedRecommendation,
    NotEligibleRecommendation,
    TopRecommendation,
    RecommendationResponse
)

def get_recommendations(student: StudentProfile, internships: List[InternshipOpportunity]) -> RecommendationResponse:
    eligible_list: List[Tuple[InternshipOpportunity, int, Dict[str, Any]]] = []
    not_eligible_list: List[NotEligibleRecommendation] = []

    # Pre-process student attributes for case-insensitive matching
    student_skills_lower = [s.lower().strip() for s in student.skills]
    student_interests_lower = [i.lower().strip() for i in student.interests]
    student_programme_lower = student.programme.lower().strip()
    student_year_upper = student.year.upper().strip()

    for item in internships:
        reasons_ineligible = []

        # 1. Eligibility check: Programme
        # Check if the internship's required programme is a substring of the student's programme
        req_programme = item.eligibility.programme
        if req_programme.lower().strip() not in student_programme_lower:
            reasons_ineligible.append(f"programme '{student.programme}' does not match required '{req_programme}'")

        # 2. Eligibility check: Year
        req_years = [y.upper().strip() for y in item.eligibility.years]
        if student_year_upper not in req_years:
            allowed_years_str = ", ".join(item.eligibility.years)
            reasons_ineligible.append(f"year '{student.year}' does not match allowed years [{allowed_years_str}]")

        # 3. Eligibility check: CGPA
        if item.eligibility.min_cgpa is not None:
            if student.cgpa < item.eligibility.min_cgpa:
                reasons_ineligible.append(f"CGPA {student.cgpa} is below required {item.eligibility.min_cgpa}")

        # If not eligible due to programme, year, or CGPA
        if reasons_ineligible:
            reason_str = f"Not eligible because: {'; '.join(reasons_ineligible)}."
            not_eligible_list.append(NotEligibleRecommendation(
                title=item.title,
                organization=item.organization,
                reason=reason_str
            ))
            continue

        # If eligible by program/year/CGPA, calculate relevance score
        score = 0
        matched_skills: List[str] = []
        partial_skills: List[str] = []
        missing_skills: List[str] = []

        # Calculate skill matches
        for req_skill in item.required_skills:
            req_skill_lower = req_skill.lower().strip()
            # Check for exact match
            if req_skill_lower in student_skills_lower:
                score += 2
                matched_skills.append(req_skill)
            else:
                # Check for partial match (substring overlap)
                is_partial = False
                for stud_skill in student_skills_lower:
                    if len(req_skill_lower) >= 3 and len(stud_skill) >= 3:
                        if (req_skill_lower in stud_skill) or (stud_skill in req_skill_lower):
                            score += 1
                            partial_skills.append(req_skill)
                            is_partial = True
                            break
                if not is_partial:
                    missing_skills.append(req_skill)

        # Calculate interest/domain matches
        domain_matched = False
        matched_interest_val = None
        item_domain_lower = item.domain.lower().strip()
        if item_domain_lower in student_interests_lower:
            score += 2
            domain_matched = True
            # Find the original case student interest that matched
            idx = student_interests_lower.index(item_domain_lower)
            matched_interest_val = student.interests[idx]

        # Check if there is a skill mismatch (score is 0)
        if score == 0:
            skills_str = ", ".join(item.required_skills)
            reason_str = f"Requires {skills_str} skills which are not in your profile; also no domain interest match."
            not_eligible_list.append(NotEligibleRecommendation(
                title=item.title,
                organization=item.organization,
                reason=reason_str
            ))
            continue

        # Determine match level
        if score >= 4:
            match_level = "High"
        elif score >= 2:
            match_level = "Medium"
        else:
            match_level = "Low"

        # Construct reason sentence
        reason_parts = []
        all_matched_skills = matched_skills + partial_skills
        if all_matched_skills:
            skills_str = ", ".join(all_matched_skills)
            reason_parts.append(skills_str)
        
        # Build reason string
        if all_matched_skills and domain_matched:
            reason_str = f"Matches {skills_str} and your {item.domain} interest. Meets year and CGPA requirements."
        elif all_matched_skills:
            reason_str = f"Matches {skills_str}. Meets year and CGPA requirements."
        elif domain_matched:
            reason_str = f"Matches your {item.domain} interest. Meets year and CGPA requirements."
        else:
            reason_str = "Meets year and CGPA requirements."

        details = {
            "match_level": match_level,
            "matched_skills": all_matched_skills,
            "matched_interest": matched_interest_val,
            "missing_preferred_skills": missing_skills,
            "reason": reason_str,
            "score": score
        }

        eligible_list.append((item, score, details))

    # Sort eligible by score descending (stable sort preserves original order)
    eligible_list.sort(key=lambda x: -x[1])

    ranked_recommendations: List[RankedRecommendation] = []
    for rank_idx, (item, score, details) in enumerate(eligible_list, start=1):
        ranked_recommendations.append(RankedRecommendation(
            rank=rank_idx,
            title=item.title,
            organization=item.organization,
            match_level=details["match_level"],
            matched_skills=details["matched_skills"],
            matched_interest=details["matched_interest"],
            missing_preferred_skills=details["missing_preferred_skills"],
            eligibility_status="Eligible",
            reason=details["reason"],
            deadline=item.deadline,
            application_link=item.application_link
        ))

    # Determine top recommendation
    top_rec = None
    if ranked_recommendations:
        first_item = ranked_recommendations[0]
        # Build a longer paragraph explanation for the top recommendation
        skills_phrase = f"your skills in {', '.join(first_item.matched_skills)}" if first_item.matched_skills else "your profile background"
        interest_phrase = f" and your domain interest in '{first_item.matched_interest}'" if first_item.matched_interest else ""
        
        why_para = (
            f"The '{first_item.title}' role at {first_item.organization or 'Placement Cell'} is our top recommendation for you "
            f"with a {first_item.match_level} match level. This internship strongly aligns with {skills_phrase}{interest_phrase}. "
            f"You satisfy all requirements, and your academic standing meets or exceeds the eligibility criteria. "
            f"Be sure to apply before the deadline on {first_item.deadline}."
        )
        
        top_rec = TopRecommendation(
            rank=first_item.rank,
            title=first_item.title,
            organization=first_item.organization,
            match_level=first_item.match_level,
            matched_skills=first_item.matched_skills,
            matched_interest=first_item.matched_interest,
            missing_preferred_skills=first_item.missing_preferred_skills,
            eligibility_status=first_item.eligibility_status,
            reason=first_item.reason,
            deadline=first_item.deadline,
            application_link=first_item.application_link,
            why_recommended=why_para
        )

    # Determine top level message if no recommendations matched
    message = None
    if not ranked_recommendations:
        message = "No internships in the current list match your eligibility. Here's what's closest and why you didn't qualify."

    return RecommendationResponse(
        ranked=ranked_recommendations,
        not_eligible=not_eligible_list,
        top_recommendation=top_rec,
        message=message
    )
