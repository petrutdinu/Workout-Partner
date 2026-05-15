const MET: Record<string, number> = {
  running: 11, running_slow: 8, running_fast: 14, cycling: 8,
  cycling_light: 6, cycling_vigorous: 12, swimming: 7, walking: 3.5,
  elliptical: 5, rowing: 7, jump_rope: 12, hiit: 10,
  weight_training: 3.5, weightlifting: 6, bodyweight: 4, crossfit: 8,
  powerlifting: 6, resistance_bands: 3, yoga: 2.5, pilates: 3,
  stretching: 2, basketball: 8, football: 8, tennis: 7, boxing: 9, general: 4,
};
const DEFAULT_KG = 75;

function getMet(type: string) {
  return MET[(type || 'general').toLowerCase().replace(/ /g, '_')] ?? MET.general;
}

export function estimateSessionCalories(type: string, minutes: number, kg?: number) {
  return Math.round(getMet(type) * (kg || DEFAULT_KG) * (minutes / 60) * 100) / 100;
}

export function estimateExerciseCalories(
  name: string, sets?: number, reps?: number,
  weightKg?: number, durationSec?: number, userKg?: number,
): { calories: number; met: number } {
  const met = getMet(name);
  const kg = userKg || DEFAULT_KG;
  let calories = 0;
  if (durationSec > 0) {
    calories = Math.round(met * kg * (durationSec / 3600) * 100) / 100;
  } else if (sets && reps) {
    const sec = sets * reps * 4;
    const vol = Math.min(1.5, 1 + (sets * reps * (weightKg || 0)) / 5000);
    calories = Math.round(met * kg * (sec / 3600) * vol * 100) / 100;
  }
  return { calories, met };
}
