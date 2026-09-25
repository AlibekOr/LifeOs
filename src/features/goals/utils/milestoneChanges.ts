import type { GoalMilestone } from '../../../types/goal.types.ts';

// A row in the goal form: `id` is null for a milestone that is not saved yet,
// `key` identifies the row while editing (the id, or a temporary one).
export type EditableMilestone = {
  id: string | null;
  key: string;
  title: string;
};

export type MilestoneChanges = {
  create: { title: string; position: number }[];
  update: { id: string; title: string; position: number }[];
  remove: string[];
};

// What has to be written so the saved milestones match the form: blank rows are
// dropped, order in the form becomes `position`, and only rows that actually
// changed are updated.
export function planMilestoneChanges(
  existing: readonly GoalMilestone[],
  edited: readonly Pick<EditableMilestone, 'id' | 'title'>[],
): MilestoneChanges {
  const kept = edited
    .map(milestone => ({ id: milestone.id, title: milestone.title.trim() }))
    .filter(milestone => milestone.title.length > 0);

  const existingById = new Map(existing.map(m => [m.id, m]));
  const keptIds = new Set(kept.flatMap(m => (m.id ? [m.id] : [])));

  const changes: MilestoneChanges = {
    create: [],
    update: [],
    remove: existing.filter(m => !keptIds.has(m.id)).map(m => m.id),
  };

  kept.forEach((milestone, position) => {
    const current = milestone.id ? existingById.get(milestone.id) : undefined;
    if (!current) {
      changes.create.push({ title: milestone.title, position });
      return;
    }
    if (current.title !== milestone.title || current.position !== position) {
      changes.update.push({
        id: current.id,
        title: milestone.title,
        position,
      });
    }
  });

  return changes;
}
