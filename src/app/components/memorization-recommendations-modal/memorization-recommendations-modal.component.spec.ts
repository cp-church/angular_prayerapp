import { describe, it, expect } from 'vitest';
import { MemorizationRecommendationsModalComponent } from './memorization-recommendations-modal.component';
import type {
  MemorizationRecommendation,
  MemorizationRecommendationCategoryGroup,
} from '../../types/memorization';

const sample: MemorizationRecommendation = {
  id: 'r1',
  reference: 'John 3:16',
  translation: 'esv',
  categoryId: 'cat-1',
  displayOrder: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const groups: MemorizationRecommendationCategoryGroup[] = [
  {
    category: {
      id: 'cat-1',
      name: 'Gospel',
      displayOrder: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    items: [sample],
  },
  {
    category: {
      id: 'cat-2',
      name: 'Empty',
      displayOrder: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    items: [],
  },
];

describe('MemorizationRecommendationsModalComponent', () => {
  it('isAlreadyAdded uses translation:reference keys', () => {
    const modal = new MemorizationRecommendationsModalComponent();
    modal.alreadyAddedReferences = new Set(['esv:John 3:16']);
    expect(modal.isAlreadyAdded(sample)).toBe(true);
    expect(
      modal.isAlreadyAdded({ ...sample, id: 'r2', reference: 'Romans 8:28' })
    ).toBe(false);
  });

  it('groupsWithVerses hides empty categories', () => {
    const modal = new MemorizationRecommendationsModalComponent();
    modal.groups = groups;
    expect(modal.groupsWithVerses).toHaveLength(1);
    expect(modal.groupsWithVerses[0].category.name).toBe('Gospel');
  });
});
