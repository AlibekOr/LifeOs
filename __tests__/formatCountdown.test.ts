import {
  formatCountdown,
  formatCountdownSpoken,
} from '../src/utils/formatCountdown.ts';

describe('formatCountdownSpoken', () => {
  it('uses whole minutes, rounded down', () => {
    expect(formatCountdownSpoken(45 * 60 * 1000 + 59 * 1000)).toBe(
      '45 minutes',
    );
  });

  it('says hours and minutes together', () => {
    expect(formatCountdownSpoken((72 * 60 + 5) * 1000)).toBe(
      '1 hour 12 minutes',
    );
    expect(formatCountdownSpoken((2 * 60 + 1) * 60 * 1000)).toBe(
      '2 hours 1 minute',
    );
  });

  it('omits a zero part', () => {
    expect(formatCountdownSpoken(60 * 60 * 1000)).toBe('1 hour');
    expect(formatCountdownSpoken(60 * 1000)).toBe('1 minute');
  });

  it('says less than a minute below 60 seconds, for zero and invalid values', () => {
    expect(formatCountdownSpoken(59999)).toBe('less than a minute');
    expect(formatCountdownSpoken(0)).toBe('less than a minute');
    expect(formatCountdownSpoken(-1000)).toBe('less than a minute');
    expect(formatCountdownSpoken(NaN)).toBe('less than a minute');
  });
});

describe('formatCountdown', () => {
  it('shows minutes and seconds below one hour', () => {
    expect(formatCountdown(12 * 60 * 1000 + 5 * 1000)).toBe('12:05');
  });

  it('pads minutes so the width stays fixed', () => {
    expect(formatCountdown(5 * 60 * 1000 + 9 * 1000)).toBe('05:09');
  });

  it('shows hours from exactly one hour up', () => {
    expect(formatCountdown(60 * 60 * 1000)).toBe('1:00:00');
    expect(formatCountdown((72 * 60 + 5) * 1000)).toBe('1:12:05');
  });

  it('switches to minutes one second before an hour', () => {
    expect(formatCountdown((60 * 60 - 1) * 1000)).toBe('59:59');
  });

  it('handles double-digit hours', () => {
    expect(formatCountdown(10 * 60 * 60 * 1000)).toBe('10:00:00');
  });

  it('rounds partial seconds up so 00:00 means finished', () => {
    expect(formatCountdown(1)).toBe('00:01');
    expect(formatCountdown(1000)).toBe('00:01');
    expect(formatCountdown(1001)).toBe('00:02');
  });

  it('shows 00:00 for zero, negative and invalid values', () => {
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(-5000)).toBe('00:00');
    expect(formatCountdown(NaN)).toBe('00:00');
  });
});
