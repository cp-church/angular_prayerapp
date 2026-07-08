import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MEMORIZATION_ROUND_AFFIRMATIONS,
  MEMORIZATION_ALL_DONE_MESSAGES,
  MEMORIZATION_ENCOURAGEMENT_MESSAGES,
  pickRandomRoundAffirmation,
  pickRandomAllDoneMessage,
  pickRandomEncouragementMessage,
} from './memorizationEncouragementMessages';

describe('message constants', () => {
  it('combines round and done messages', () => {
    expect(MEMORIZATION_ENCOURAGEMENT_MESSAGES.length).toBe(
      MEMORIZATION_ROUND_AFFIRMATIONS.length + MEMORIZATION_ALL_DONE_MESSAGES.length
    );
  });

  it('has non-empty affirmation and done messages', () => {
    expect(MEMORIZATION_ROUND_AFFIRMATIONS.length).toBeGreaterThan(0);
    expect(MEMORIZATION_ALL_DONE_MESSAGES.length).toBeGreaterThan(0);
    for (const msg of MEMORIZATION_ENCOURAGEMENT_MESSAGES) {
      expect(msg.length).toBeGreaterThan(0);
    }
  });
});

describe('pickRandomRoundAffirmation', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('picks first message when random is 0', () => {
    expect(pickRandomRoundAffirmation()).toBe(MEMORIZATION_ROUND_AFFIRMATIONS[0]);
  });

  it('picks last message when random is near 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    const last = MEMORIZATION_ROUND_AFFIRMATIONS.at(-1)!;
    expect(pickRandomRoundAffirmation()).toBe(last);
  });
});

describe('pickRandomAllDoneMessage', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('picks from all-done messages', () => {
    expect(pickRandomAllDoneMessage()).toBe(MEMORIZATION_ALL_DONE_MESSAGES[0]);
  });
});

describe('pickRandomEncouragementMessage', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('picks from combined encouragement messages', () => {
    expect(pickRandomEncouragementMessage()).toBe(MEMORIZATION_ENCOURAGEMENT_MESSAGES[0]);
  });
});
