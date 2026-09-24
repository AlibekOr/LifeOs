import { capitalizeFirst } from '../src/utils/capitalize.ts';

describe('capitalizeFirst', () => {
  it('upper-cases the first letter', () => {
    expect(capitalizeFirst('admin')).toBe('Admin');
  });

  it('leaves the rest of the text as it is', () => {
    expect(capitalizeFirst('mcDonald')).toBe('McDonald');
    expect(capitalizeFirst('aLIBEK')).toBe('ALIBEK');
  });

  it('keeps an already capitalised name', () => {
    expect(capitalizeFirst('Alibek')).toBe('Alibek');
  });

  it('handles non-Latin letters', () => {
    expect(capitalizeFirst('алибек')).toBe('Алибек');
  });

  it('returns an empty string unchanged', () => {
    expect(capitalizeFirst('')).toBe('');
  });
});
