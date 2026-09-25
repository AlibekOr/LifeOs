import {
  isHorizontalDrag,
  resolveSwipe,
} from '../src/hooks/useHorizontalSwipe.ts';

describe('isHorizontalDrag', () => {
  it('ignores small movements', () => {
    expect(isHorizontalDrag(8, 0)).toBe(false);
  });

  it('accepts a mostly sideways drag', () => {
    expect(isHorizontalDrag(40, 10)).toBe(true);
    expect(isHorizontalDrag(-40, -10)).toBe(true);
  });

  it('leaves vertical and diagonal drags to scrolling', () => {
    expect(isHorizontalDrag(10, 60)).toBe(false);
    expect(isHorizontalDrag(40, 35)).toBe(false);
  });
});

describe('resolveSwipe', () => {
  it('reports the direction the finger moved', () => {
    expect(resolveSwipe(-90, 5, 0)).toBe('left');
    expect(resolveSwipe(90, -5, 0)).toBe('right');
  });

  it('accepts a short but quick flick', () => {
    expect(resolveSwipe(-30, 0, -0.8)).toBe('left');
  });

  it('rejects a short, slow drag', () => {
    expect(resolveSwipe(-30, 0, -0.1)).toBeNull();
  });

  it('rejects a long drag that is mostly vertical', () => {
    expect(resolveSwipe(-70, 90, -0.5)).toBeNull();
  });
});
