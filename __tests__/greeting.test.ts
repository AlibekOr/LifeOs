import { getGreeting } from '../src/utils/greeting.ts';

const at = (hour: number, minute: number) =>
  new Date(2026, 8, 23, hour, minute, 0);

describe('getGreeting', () => {
  it('is evening at 04:59', () => {
    expect(getGreeting(at(4, 59))).toBe('Good evening');
  });

  it('is morning from 05:00', () => {
    expect(getGreeting(at(5, 0))).toBe('Good morning');
  });

  it('is still morning at 11:59', () => {
    expect(getGreeting(at(11, 59))).toBe('Good morning');
  });

  it('is afternoon from 12:00', () => {
    expect(getGreeting(at(12, 0))).toBe('Good afternoon');
  });

  it('is still afternoon at 17:59', () => {
    expect(getGreeting(at(17, 59))).toBe('Good afternoon');
  });

  it('is evening from 18:00', () => {
    expect(getGreeting(at(18, 0))).toBe('Good evening');
  });

  it('is evening around midnight', () => {
    expect(getGreeting(at(0, 0))).toBe('Good evening');
    expect(getGreeting(at(23, 59))).toBe('Good evening');
  });
});
