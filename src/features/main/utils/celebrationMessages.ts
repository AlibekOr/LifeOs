export const CELEBRATION_HEADLINES = [
  'Task complete!',
  'Boom! Nailed it!',
  'Crushed it!',
  'Absolutely brilliant!',
  'That was impressive!',
  'You did it!',
  'Legend move!',
  'Unstoppable!',
  'Well done!',
  'Pure focus!',
  'Now that is progress!',
  'Outstanding work!',
] as const;

export const CELEBRATION_MESSAGES = [
  'Great focus! That one is done.',
  'Small steps, big wins.',
  'One task closer to your goals.',
  'You showed up and it paid off.',
  'Momentum looks good on you.',
  'Nicely done. Take a breath.',
  'Discipline beats motivation, and you just proved it.',
  'Every finished task builds the person you want to be.',
  'You made time for what matters.',
  'Proud of the effort you put in.',
  'Keep this energy. The next one will be easier.',
  'Done is better than perfect, and this is both.',
  'Your future self says thank you.',
  'Focus like that changes everything.',
] as const;

// Short praise words that pop up around the gift.
export const CELEBRATION_WORDS = [
  'WOW',
  'YES!',
  'EPIC',
  'BOOM',
  'GREAT',
  'NICE',
  'SUPER',
  'BRAVO',
  'AWESOME',
  'GENIUS',
  'LEGEND',
  'BEAST',
] as const;

export const CELEBRATION_WORD_COUNT = 3;

export type Celebration = {
  headline: string;
  message: string;
  words: string[];
  headlineIndex: number;
  messageIndex: number;
};

// A random index that differs from `avoid` (when given).
function pickIndex(
  length: number,
  avoid: number | null,
  random: () => number,
): number {
  const candidates = Array.from({ length }, (_, index) => index).filter(
    index => index !== avoid,
  );
  return candidates[
    Math.min(candidates.length - 1, Math.floor(random() * candidates.length))
  ];
}

function pickDistinctIndexes(
  length: number,
  count: number,
  random: () => number,
): number[] {
  const remaining = Array.from({ length }, (_, index) => index);
  const picked: number[] = [];
  while (picked.length < count && remaining.length > 0) {
    const at = Math.min(
      remaining.length - 1,
      Math.floor(random() * remaining.length),
    );
    picked.push(remaining.splice(at, 1)[0]);
  }
  return picked;
}

// A fresh celebration each time: the headline and the message never repeat
// what was shown last. `random` is injectable for tests.
export function pickCelebration(
  previous: Celebration | null,
  random: () => number = Math.random,
): Celebration {
  const headlineIndex = pickIndex(
    CELEBRATION_HEADLINES.length,
    previous?.headlineIndex ?? null,
    random,
  );
  const messageIndex = pickIndex(
    CELEBRATION_MESSAGES.length,
    previous?.messageIndex ?? null,
    random,
  );
  const words = pickDistinctIndexes(
    CELEBRATION_WORDS.length,
    CELEBRATION_WORD_COUNT,
    random,
  ).map(index => CELEBRATION_WORDS[index]);

  return {
    headline: CELEBRATION_HEADLINES[headlineIndex],
    message: CELEBRATION_MESSAGES[messageIndex],
    words,
    headlineIndex,
    messageIndex,
  };
}
