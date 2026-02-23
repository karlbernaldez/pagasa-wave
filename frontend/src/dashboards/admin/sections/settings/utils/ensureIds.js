// utils/ensureIds.js
const makeId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}_${Date.now()}`);

const withId = (item) => (item?.id ? item : { id: makeId(), ...item });

export const ensureIdsInSettings = (s) => ({
  ...s,
  stats: (s.stats ?? []).map(withId),
  highlights: (s.highlights ?? []).map(withId),
  programObjectives: (s.programObjectives ?? []).map(withId),
  pillars: (s.pillars ?? []).map(withId),
  milestones: (s.milestones ?? []).map(withId),
  leaders: (s.leaders ?? []).map(withId),
  partners: (s.partners ?? []).map(withId),
});