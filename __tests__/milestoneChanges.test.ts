import { planMilestoneChanges } from '../src/features/goals/utils/milestoneChanges.ts';
import type { GoalMilestone } from '../src/types/goal.types.ts';

const saved = (id: string, title: string, position: number): GoalMilestone => ({
  id,
  goal_id: 'g1',
  user_id: 'user',
  title,
  position,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
});

const existing = [saved('a', 'Basics', 0), saved('b', 'Advanced', 1)];

describe('planMilestoneChanges', () => {
  it('has nothing to do when the form is unchanged', () => {
    expect(
      planMilestoneChanges(existing, [
        { id: 'a', title: 'Basics' },
        { id: 'b', title: 'Advanced' },
      ]),
    ).toEqual({ create: [], update: [], remove: [] });
  });

  it('creates new rows at their position in the form', () => {
    const changes = planMilestoneChanges(existing, [
      { id: 'a', title: 'Basics' },
      { id: null, title: 'Middle' },
      { id: 'b', title: 'Advanced' },
    ]);
    expect(changes.create).toEqual([{ title: 'Middle', position: 1 }]);
    // "Advanced" moved from position 1 to 2.
    expect(changes.update).toEqual([
      { id: 'b', title: 'Advanced', position: 2 },
    ]);
    expect(changes.remove).toEqual([]);
  });

  it('renames a milestone', () => {
    const changes = planMilestoneChanges(existing, [
      { id: 'a', title: '  Fundamentals ' },
      { id: 'b', title: 'Advanced' },
    ]);
    expect(changes.update).toEqual([
      { id: 'a', title: 'Fundamentals', position: 0 },
    ]);
  });

  it('removes rows that are no longer in the form', () => {
    const changes = planMilestoneChanges(existing, [
      { id: 'b', title: 'Advanced' },
    ]);
    expect(changes.remove).toEqual(['a']);
    expect(changes.update).toEqual([
      { id: 'b', title: 'Advanced', position: 0 },
    ]);
  });

  it('treats a blank title as removing or skipping the row', () => {
    const changes = planMilestoneChanges(existing, [
      { id: 'a', title: '   ' },
      { id: null, title: '' },
      { id: 'b', title: 'Advanced' },
    ]);
    expect(changes.remove).toEqual(['a']);
    expect(changes.create).toEqual([]);
  });

  it('creates everything for a new goal', () => {
    const changes = planMilestoneChanges(
      [],
      [
        { id: null, title: 'One' },
        { id: null, title: 'Two' },
      ],
    );
    expect(changes.create).toEqual([
      { title: 'One', position: 0 },
      { title: 'Two', position: 1 },
    ]);
  });
});
