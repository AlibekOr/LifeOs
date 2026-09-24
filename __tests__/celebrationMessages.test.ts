import {
  CELEBRATION_HEADLINES,
  CELEBRATION_MESSAGES,
  CELEBRATION_WORDS,
  CELEBRATION_WORD_COUNT,
  pickCelebration,
} from '../src/features/main/utils/celebrationMessages.ts';

describe('pickCelebration', () => {
  it('returns a known headline, message and words with their indexes', () => {
    const result = pickCelebration(null, () => 0);
    expect(result.headline).toBe(CELEBRATION_HEADLINES[result.headlineIndex]);
    expect(result.message).toBe(CELEBRATION_MESSAGES[result.messageIndex]);
    result.words.forEach(word => {
      expect(CELEBRATION_WORDS).toContain(word);
    });
  });

  it('picks the configured number of distinct praise words', () => {
    [0, 0.3, 0.6, 0.999999].forEach(value => {
      const { words } = pickCelebration(null, () => value);
      expect(words).toHaveLength(CELEBRATION_WORD_COUNT);
      expect(new Set(words).size).toBe(CELEBRATION_WORD_COUNT);
    });
  });

  it('never repeats the previous headline or message', () => {
    const randoms = [0, 0.25, 0.5, 0.75, 0.999999];
    randoms.forEach(value => {
      let previous = pickCelebration(null, () => value);
      for (let round = 0; round < 30; round++) {
        const next = pickCelebration(previous, () => (value + round / 30) % 1);
        expect(next.headlineIndex).not.toBe(previous.headlineIndex);
        expect(next.messageIndex).not.toBe(previous.messageIndex);
        previous = next;
      }
    });
  });

  it('can reach every headline, message and word across the random range', () => {
    const headlines = new Set<number>();
    const messages = new Set<number>();
    const words = new Set<string>();
    for (let step = 0; step < 200; step++) {
      const result = pickCelebration(null, () => step / 200);
      headlines.add(result.headlineIndex);
      messages.add(result.messageIndex);
      result.words.forEach(word => words.add(word));
    }
    expect(headlines.size).toBe(CELEBRATION_HEADLINES.length);
    expect(messages.size).toBe(CELEBRATION_MESSAGES.length);
    expect(words.size).toBe(CELEBRATION_WORDS.length);
  });

  it('stays in range for a random value of exactly 1', () => {
    const result = pickCelebration(null, () => 1);
    expect(result.headlineIndex).toBe(CELEBRATION_HEADLINES.length - 1);
    expect(result.messageIndex).toBe(CELEBRATION_MESSAGES.length - 1);
    expect(result.words).toHaveLength(CELEBRATION_WORD_COUNT);
  });
});
