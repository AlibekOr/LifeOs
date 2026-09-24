import React from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useCountdown, type Countdown } from '../src/hooks/useCountdown.ts';

const BASE = new Date(2026, 8, 23, 12, 0, 0);
const inSeconds = (seconds: number) =>
  new Date(BASE.getTime() + seconds * 1000);

const result: { current: Countdown | null } = { current: null };
const current = (): Countdown => {
  if (!result.current) {
    throw new Error('Probe has not rendered');
  }
  return result.current;
};

const Probe = ({ target }: { target: Date }) => {
  result.current = useCountdown(target);
  return null;
};

let appStateListener: ((state: AppStateStatus) => void) | undefined;
const removeSubscription = jest.fn();
let appState: AppStateStatus;

const mount = (target: Date) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(<Probe target={target} />);
  });
  return renderer;
};

const advance = (ms: number) => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

const changeAppState = (state: AppStateStatus) => {
  act(() => {
    appState = state;
    appStateListener?.(state);
  });
};

// currentState is a plain data property, so it cannot be spied on as a getter.
const originalCurrentState = Object.getOwnPropertyDescriptor(
  AppState,
  'currentState',
);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(BASE);
  appState = 'active';
  appStateListener = undefined;
  removeSubscription.mockClear();
  Object.defineProperty(AppState, 'currentState', {
    configurable: true,
    get: () => appState,
  });
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((
    _type: string,
    listener: (state: AppStateStatus) => void,
  ) => {
    appStateListener = listener;
    return { remove: removeSubscription };
  }) as typeof AppState.addEventListener);
});

afterEach(() => {
  if (originalCurrentState) {
    Object.defineProperty(AppState, 'currentState', originalCurrentState);
  }
  jest.restoreAllMocks();
  jest.useRealTimers();
  result.current = null;
});

describe('useCountdown', () => {
  it('starts with the time left until the target', () => {
    mount(inSeconds(90));
    expect(current()).toEqual({ remainingMs: 90000, isFinished: false });
  });

  it('ticks once per second', () => {
    mount(inSeconds(90));
    advance(1000);
    expect(current().remainingMs).toBe(89000);
    advance(3000);
    expect(current().remainingMs).toBe(86000);
  });

  it('follows the clock instead of counting ticks, so it cannot drift', () => {
    mount(inSeconds(90));
    // The clock jumps 60s (e.g. a stalled JS thread) before the next tick.
    jest.setSystemTime(inSeconds(60));
    advance(1000);
    expect(current().remainingMs).toBe(29000);
  });

  it('finishes at zero and stops ticking', () => {
    mount(inSeconds(2));
    advance(2000);
    expect(current()).toEqual({ remainingMs: 0, isFinished: true });
    expect(jest.getTimerCount()).toBe(0);
  });

  it('is finished at once when the target is already in the past', () => {
    mount(inSeconds(-10));
    expect(current()).toEqual({ remainingMs: 0, isFinished: true });
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not tick in the background and recomputes on return', () => {
    mount(inSeconds(90));
    changeAppState('background');
    expect(jest.getTimerCount()).toBe(0);

    jest.setSystemTime(inSeconds(30));
    changeAppState('active');
    expect(current().remainingMs).toBe(60000);
    expect(jest.getTimerCount()).toBe(1);
  });

  it('does not start ticking when mounted while in the background', () => {
    appState = 'background';
    mount(inSeconds(90));
    expect(jest.getTimerCount()).toBe(0);
  });

  it('starts counting to a new target, even after it had finished', () => {
    const renderer = mount(inSeconds(2));
    advance(2000);
    expect(current().isFinished).toBe(true);

    // e.g. "+15 min" pushes the end out again.
    act(() => {
      renderer.update(<Probe target={inSeconds(2 + 900)} />);
    });
    expect(current().isFinished).toBe(false);
    expect(current().remainingMs).toBe(900000);
    expect(jest.getTimerCount()).toBe(1);
  });

  it('cleans up its interval and app state subscription on unmount', () => {
    const renderer = mount(inSeconds(90));
    expect(jest.getTimerCount()).toBe(1);

    act(() => {
      renderer.unmount();
    });
    expect(jest.getTimerCount()).toBe(0);
    expect(removeSubscription).toHaveBeenCalledTimes(1);
  });
});
