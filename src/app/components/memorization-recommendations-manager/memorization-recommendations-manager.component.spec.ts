import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemorizationRecommendationsManagerComponent } from './memorization-recommendations-manager.component';
import type {
  MemorizationRecommendation,
  MemorizationRecommendationCategoryGroup,
} from '../../types/memorization';

function makeGroup(
  categoryId: string,
  name: string,
  items: MemorizationRecommendation[]
): MemorizationRecommendationCategoryGroup {
  return {
    category: {
      id: categoryId,
      name,
      displayOrder: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    items,
  };
}

function makeItem(
  id: string,
  categoryId: string,
  reference: string
): MemorizationRecommendation {
  return {
    id,
    reference,
    translation: 'esv',
    categoryId,
    displayOrder: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('MemorizationRecommendationsManagerComponent', () => {
  let component: MemorizationRecommendationsManagerComponent;
  let persistVersePlacements: ReturnType<typeof vi.fn>;
  let reorderCategories: ReturnType<typeof vi.fn>;
  let recommendations: {
    persistVersePlacements: ReturnType<typeof vi.fn>;
    reorderCategories: ReturnType<typeof vi.fn>;
    groupedSnapshot: MemorizationRecommendationCategoryGroup[];
    load: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    persistVersePlacements = vi.fn(() => Promise.resolve(true));
    reorderCategories = vi.fn(() => Promise.resolve(true));
    recommendations = {
      persistVersePlacements,
      reorderCategories,
      groupedSnapshot: [
        makeGroup('cat-1', 'A', [makeItem('v1', 'cat-1', 'John 3:16')]),
        makeGroup('cat-2', 'B', []),
      ],
      load: vi.fn(() => Promise.resolve([])),
    };
    component = new MemorizationRecommendationsManagerComponent(
      {
        ...recommendations,
        addCategory: vi.fn(),
        renameCategory: vi.fn(),
        deleteCategory: vi.fn(),
        addRecommendation: vi.fn(),
        removeRecommendation: vi.fn(),
      } as any,
      {
        getPreferredTranslation: vi.fn(() => 'esv' as const),
        setPreferredTranslation: vi.fn(),
      } as any,
      {} as any,
      { error: vi.fn(), success: vi.fn() } as any,
      { markForCheck: vi.fn(), detectChanges: vi.fn() } as any,
      { tick: vi.fn() } as any
    );
    component.groups = [
      makeGroup('cat-1', 'A', [makeItem('v1', 'cat-1', 'John 3:16')]),
      makeGroup('cat-2', 'B', []),
    ];
  });

  it('ignores verse drops while a prior verse reorder is in flight', async () => {
    component.reorderingVerses = true;
    await component.onVerseDrop(
      {
        previousContainer: { id: 'rec-verses-cat-1', data: component.groups[0].items },
        container: { id: 'rec-verses-cat-1', data: component.groups[0].items },
        previousIndex: 0,
        currentIndex: 0,
      } as any,
      'cat-1'
    );
    expect(persistVersePlacements).not.toHaveBeenCalled();
  });

  it('ignores category drops while a prior category reorder is in flight', async () => {
    component.reorderingCategories = true;
    await component.onCategoryDrop({
      previousIndex: 0,
      currentIndex: 1,
    } as any);
    expect(reorderCategories).not.toHaveBeenCalled();
  });

  it('restores groups from service snapshot when verse move persist fails', async () => {
    persistVersePlacements.mockResolvedValue(false);
    const sourceItems = component.groups[0].items;
    const targetItems = component.groups[1].items;

    await component.onVerseDrop(
      {
        previousContainer: { id: 'rec-verses-cat-1', data: sourceItems },
        container: { id: 'rec-verses-cat-2', data: targetItems },
        previousIndex: 0,
        currentIndex: 0,
      } as any,
      'cat-2'
    );

    expect(component.groups[0].items).toHaveLength(1);
    expect(component.groups[0].items[0].categoryId).toBe('cat-1');
    expect(component.groups[1].items).toHaveLength(0);
  });

  it('prepareTourInitialState expands, loads, and returns whether categories exist', async () => {
    component.sectionExpanded = false;
    component.loadedOnce = false;
    component.showPicker = true;
    component.showAddCategory = true;

    const hasCategories = await component.prepareTourInitialState();

    expect(component.sectionExpanded).toBe(true);
    expect(component.showPicker).toBe(false);
    expect(component.showAddCategory).toBe(false);
    expect(recommendations.load).toHaveBeenCalledWith(true);
    expect(hasCategories).toBe(true);
    expect(component.addTargetCategoryId).toBe('cat-1');
  });
});
