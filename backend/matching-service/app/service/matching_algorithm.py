"""
AI Smart Match Algorithm
Weighted Jaccard similarity on user fitness profiles.

Formula:
  match_score = 0.30 * level_compat
              + 0.25 * goal_jaccard
              + 0.25 * schedule_score
              + 0.15 * type_jaccard
              + 0.05 * age_proximity

All components return values in [0.0, 1.0].
"""
from typing import List, Optional
import numpy as np

# Fitness level ordering for compatibility scoring
LEVEL_ORDER = {"Beginner": 0, "Intermediate": 1, "Advanced": 2, "Elite": 3}
LEVEL_COMPAT = {0: 1.0, 1: 0.7, 2: 0.3, 3: 0.0}  # keyed by abs distance

TIME_COMPAT = {
    ("morning", "morning"): 1.0,
    ("afternoon", "afternoon"): 1.0,
    ("evening", "evening"): 1.0,
    ("flexible", "flexible"): 1.0,
    ("morning", "flexible"): 1.0,
    ("afternoon", "flexible"): 1.0,
    ("evening", "flexible"): 1.0,
    ("flexible", "morning"): 1.0,
    ("flexible", "afternoon"): 1.0,
    ("flexible", "evening"): 1.0,
    ("morning", "afternoon"): 0.4,
    ("afternoon", "morning"): 0.4,
    ("afternoon", "evening"): 0.4,
    ("evening", "afternoon"): 0.4,
    ("morning", "evening"): 0.0,
    ("evening", "morning"): 0.0,
}


def _jaccard(a: List, b: List) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    sa, sb = set(a), set(b)
    intersection = len(sa & sb)
    union = len(sa | sb)
    return intersection / union if union > 0 else 0.0


def _level_compat(level_a: Optional[str], level_b: Optional[str]) -> float:
    if not level_a or not level_b:
        return 0.5  # neutral if unknown
    idx_a = LEVEL_ORDER.get(level_a, 1)
    idx_b = LEVEL_ORDER.get(level_b, 1)
    distance = abs(idx_a - idx_b)
    return LEVEL_COMPAT.get(distance, 0.0)


def _schedule_score(days_a: List, days_b: List, time_a: Optional[str], time_b: Optional[str]) -> float:
    day_j = _jaccard(days_a, days_b)
    ta = (time_a or "flexible").lower()
    tb = (time_b or "flexible").lower()
    time_c = TIME_COMPAT.get((ta, tb), 0.5)
    return day_j * 0.6 + time_c * 0.4


def _age_proximity(age_a: Optional[int], age_b: Optional[int]) -> float:
    if age_a is None or age_b is None:
        return 0.5
    return max(0.0, 1.0 - abs(age_a - age_b) / 50.0)


def calculate_match_score(user_a: dict, user_b: dict) -> float:
    """
    Calculate compatibility score between two user profile dicts.
    Expected keys: fitness_level, primary_goal, workout_types, preferred_days,
                   preferred_time, age
    Returns float in [0.0, 1.0].
    """
    goal_a = [user_a.get("primary_goal")] if user_a.get("primary_goal") else []
    goal_b = [user_b.get("primary_goal")] if user_b.get("primary_goal") else []

    level = _level_compat(user_a.get("fitness_level"), user_b.get("fitness_level"))
    goal = _jaccard(goal_a, goal_b)
    schedule = _schedule_score(
        user_a.get("preferred_days") or [],
        user_b.get("preferred_days") or [],
        user_a.get("preferred_time"),
        user_b.get("preferred_time"),
    )
    workout_type = _jaccard(
        user_a.get("workout_types") or [],
        user_b.get("workout_types") or [],
    )
    age = _age_proximity(user_a.get("age"), user_b.get("age"))

    score = (
        0.30 * level
        + 0.25 * goal
        + 0.25 * schedule
        + 0.15 * workout_type
        + 0.05 * age
    )
    return round(float(score), 4)


def rank_candidates(current_user: dict, candidates: List[dict]) -> List[dict]:
    """
    Rank a list of candidate user dicts by match score with current_user.
    Each candidate dict must have an 'id' field.
    Returns sorted list descending by match_score, top 20.
    """
    if not candidates:
        return []

    scores = np.array([calculate_match_score(current_user, c) for c in candidates])
    sorted_indices = np.argsort(scores)[::-1]

    results = []
    for i in sorted_indices[:20]:
        candidate = dict(candidates[i])
        candidate["match_score"] = float(scores[i])
        results.append(candidate)

    return results
