import { describe, it, expect, vi } from 'vitest';
import { MemorizationRecommendationCardComponent } from './memorization-recommendation-card.component';
import type { MemorizationRecommendation } from '../../types/memorization';

const sample: MemorizationRecommendation = {
  id: 'r1',
  reference: 'John 3:16',
  translation: 'esv',
  categoryId: 'cat-1',
  displayOrder: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('MemorizationRecommendationCardComponent', () => {
  it('emits add when not already added', () => {
    const card = new MemorizationRecommendationCardComponent();
    card.recommendation = sample;
    card.alreadyAdded = false;
    const emit = vi.spyOn(card.add, 'emit');
    card.onClick();
    expect(emit).toHaveBeenCalledWith(sample);
  });

  it('does not emit when already added', () => {
    const card = new MemorizationRecommendationCardComponent();
    card.recommendation = sample;
    card.alreadyAdded = true;
    const emit = vi.spyOn(card.add, 'emit');
    card.onClick();
    expect(emit).not.toHaveBeenCalled();
  });

  it('does not emit when busy', () => {
    const card = new MemorizationRecommendationCardComponent();
    card.recommendation = sample;
    card.busy = true;
    const emit = vi.spyOn(card.add, 'emit');
    card.onClick();
    expect(emit).not.toHaveBeenCalled();
  });
});
