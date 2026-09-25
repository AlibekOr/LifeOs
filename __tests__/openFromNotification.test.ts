import { navigationRef } from '../src/app/navigation/navigationRef.ts';
import { openFromNotification } from '../src/features/notifications/utils/openFromNotification.ts';

jest.mock('../src/app/navigation/navigationRef.ts', () => ({
  navigationRef: { isReady: jest.fn(), navigate: jest.fn() },
}));

const isReady = navigationRef.isReady as jest.Mock;
const navigate = navigationRef.navigate as unknown as jest.Mock;

beforeEach(() => {
  isReady.mockReset().mockReturnValue(true);
  navigate.mockReset();
});

describe('openFromNotification', () => {
  it('opens the plan form for a plan reminder', () => {
    openFromNotification({ planId: 'plan-1' });
    expect(navigate).toHaveBeenCalledWith('Tasks', {
      screen: 'PlanForm',
      params: { planId: 'plan-1' },
      initial: false,
    });
  });

  it('opens the task form for a task reminder', () => {
    openFromNotification({ taskId: 'task-1', kind: 'lead' });
    expect(navigate).toHaveBeenCalledWith('Tasks', {
      screen: 'TaskForm',
      params: { taskId: 'task-1' },
      initial: false,
    });
  });

  it('opens Home for the start and end alerts of a task', () => {
    openFromNotification({ taskId: 'task-1', kind: 'end' });
    expect(navigate).toHaveBeenCalledWith('Home');
  });

  it('does nothing before navigation is ready', () => {
    isReady.mockReturnValue(false);
    openFromNotification({ planId: 'plan-1' });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores notifications it does not know', () => {
    openFromNotification(undefined);
    openFromNotification({ other: 'x' });
    expect(navigate).not.toHaveBeenCalled();
  });
});
