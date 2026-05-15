MET_VALUES = {
    # Cardio
    "running": 11.0,
    "running_slow": 8.0,
    "running_fast": 14.0,
    "cycling": 8.0,
    "cycling_light": 6.0,
    "cycling_vigorous": 12.0,
    "swimming": 7.0,
    "walking": 3.5,
    "elliptical": 5.0,
    "rowing": 7.0,
    "jump_rope": 12.0,
    "hiit": 10.0,
    # Strength
    "weight_training": 3.5,
    "weightlifting": 6.0,
    "bodyweight": 4.0,
    "crossfit": 8.0,
    "powerlifting": 6.0,
    "resistance_bands": 3.0,
    # Flexibility / mind-body
    "yoga": 2.5,
    "pilates": 3.0,
    "stretching": 2.0,
    # Sports
    "basketball": 8.0,
    "football": 8.0,
    "tennis": 7.0,
    "boxing": 9.0,
    # Default
    "general": 4.0,
}

DEFAULT_WEIGHT_KG = 75.0


def get_met(workout_type: str) -> float:
    key = workout_type.lower().replace(" ", "_") if workout_type else "general"
    return MET_VALUES.get(key, MET_VALUES["general"])


def estimate_session_calories(workout_type: str, duration_minutes: int, weight_kg: float = None) -> float:
    """MET × weight_kg × duration_hours"""
    met = get_met(workout_type)
    kg = weight_kg or DEFAULT_WEIGHT_KG
    hours = duration_minutes / 60.0
    return round(met * kg * hours, 2)


def estimate_exercise_calories(
    exercise_name: str,
    sets: int = None,
    reps: int = None,
    weight_kg: float = None,
    duration_sec: int = None,
    user_weight_kg: float = None
) -> tuple[float, float]:
    """Returns (calories, met_value)."""
    met = get_met(exercise_name)
    kg = user_weight_kg or DEFAULT_WEIGHT_KG

    if duration_sec and duration_sec > 0:
        calories = round(met * kg * (duration_sec / 3600.0), 2)
    elif sets and reps:
        # Estimate ~3 seconds per rep, plus rest
        estimated_sec = sets * reps * 4
        volume_factor = min(1.5, 1.0 + ((sets * reps * (weight_kg or 0)) / 5000.0))
        calories = round(met * kg * (estimated_sec / 3600.0) * volume_factor, 2)
    else:
        calories = 0.0

    return calories, met
