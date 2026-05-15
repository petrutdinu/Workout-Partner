const LEVEL_ORDER: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2, Elite: 3 };
const LEVEL_COMPAT: Record<number, number> = { 0: 1.0, 1: 0.7, 2: 0.3, 3: 0.0 };
const TIME_COMPAT: Record<string, number> = {
  'morning:morning': 1, 'afternoon:afternoon': 1, 'evening:evening': 1,
  'flexible:flexible': 1, 'morning:flexible': 1, 'afternoon:flexible': 1,
  'evening:flexible': 1, 'flexible:morning': 1, 'flexible:afternoon': 1,
  'flexible:evening': 1, 'morning:afternoon': 0.4, 'afternoon:morning': 0.4,
  'afternoon:evening': 0.4, 'evening:afternoon': 0.4,
  'morning:evening': 0, 'evening:morning': 0,
};

function jaccard(a: string[], b: string[]) {
  if (!a?.length && !b?.length) return 1;
  if (!a?.length || !b?.length) return 0;
  const sa = new Set(a), sb = new Set(b);
  const inter = [...sa].filter((x) => sb.has(x)).length;
  return inter / (sa.size + sb.size - inter);
}

function levelCompat(a?: string, b?: string) {
  if (!a || !b) return 0.5;
  return LEVEL_COMPAT[Math.abs((LEVEL_ORDER[a] ?? 1) - (LEVEL_ORDER[b] ?? 1))] ?? 0;
}

function scheduleScore(daysA: string[], daysB: string[], timeA?: string, timeB?: string) {
  const ta = (timeA || 'flexible').toLowerCase();
  const tb = (timeB || 'flexible').toLowerCase();
  return jaccard(daysA, daysB) * 0.6 + (TIME_COMPAT[`${ta}:${tb}`] ?? 0.5) * 0.4;
}

function ageProximity(a?: number, b?: number) {
  if (a == null || b == null) return 0.5;
  return Math.max(0, 1 - Math.abs(a - b) / 50);
}

export function calculateMatchScore(a: any, b: any): number {
  const goalA = a.primary_goal ? [a.primary_goal] : [];
  const goalB = b.primary_goal ? [b.primary_goal] : [];
  const score =
    0.30 * levelCompat(a.fitness_level, b.fitness_level) +
    0.25 * jaccard(goalA, goalB) +
    0.25 * scheduleScore(a.preferred_days || [], b.preferred_days || [], a.preferred_time, b.preferred_time) +
    0.15 * jaccard(a.workout_types || [], b.workout_types || []) +
    0.05 * ageProximity(a.age, b.age);
  return Math.round(score * 10000) / 10000;
}

export function rankCandidates(current: any, candidates: any[]): any[] {
  return candidates
    .map((c) => ({ ...c, match_score: calculateMatchScore(current, c) }))
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 20);
}
