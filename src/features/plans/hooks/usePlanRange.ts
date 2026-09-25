import { useMemo } from 'react';
import { MINUTE_MS, useNow } from '../../../hooks/useNow.ts';
import type { PlanRange } from '../../../types/plan.types.ts';
import { planRangeFor, toDateString } from '../utils/planDates.ts';

// The range every screen loads plans for. It only changes when the date does,
// so the query key (and cache entry) stays the same all day.
export function usePlanRange(): PlanRange {
  const today = toDateString(useNow(MINUTE_MS));
  return useMemo(() => planRangeFor(today), [today]);
}
