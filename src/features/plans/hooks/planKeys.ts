import type { PlanRange } from '../../../types/plan.types.ts';

export const planKeys = {
  all: ['plans'] as const,
  range: ({ from, to }: PlanRange) => ['plans', from, to] as const,
};
