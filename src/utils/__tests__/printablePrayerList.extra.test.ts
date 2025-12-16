import 'vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the supabase module
vi.mock('../../lib/supabase', async () => {
  return {
    supabase: {
      from: vi.fn(),
      channel: vi.fn(),
      removeChannel: vi.fn()
    },
    handleSupabaseError: vi.fn()
  } as any;
});

import { supabase } from '../../lib/supabase';

describe('downloadPrintablePrayerList - Extra Coverage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    if ((window.open as any).mockRestore) {
      try { (window.open as any).mockRestore() } catch (e) { /* ignore */ }
    }
  });

  it('handles "all" time range and generates correct HTML', async () => {
    const now = new Date().toISOString();
    const samplePrayers = [
      {
        id: 'p1',
        title: 'Prayer 1',
        prayer_for: 'All Time',
        description: 'All time prayer',
        requester: 'John',
        status: 'current',
        created_at: now,
        prayer_updates: []
      },
      {
        id: 'p2',
        title: 'Prayer 2',
        prayer_for: 'All Time',
        description: 'Another all time prayer',
        requester: 'Jane',
        status: 'answered',
        created_at: now,
        date_answered: now,
        prayer_updates: []
      }
    ];

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: samplePrayers, error: null })
    } as any;

    vi.mocked(supabase.from).mockReturnValue(chain);

    const fakeDoc = {
      open: vi.fn(),
      write: vi.fn(),
      close: vi.fn()
    } as any;

    const fakeWin: any = { document: fakeDoc, focus: vi.fn() };

    const mod = await import('../printablePrayerList');
    await mod.downloadPrintablePrayerList('all', fakeWin as any);

    const written = (fakeDoc.write as any).mock.calls[0][0] as string;
    expect(written).toContain('All Prayers');
    expect(written).toContain('Current Prayers');
    expect(written).toContain('Answered Prayers');
  });

  it('handles "twoweeks" time range', async () => {
    const now = new Date().toISOString();
    const samplePrayer = {
      id: 'p1',
      title: 'Two Week Prayer',
      prayer_for: 'Community',
      description: 'Prayer within 2 weeks',
      requester: 'Alice',
      status: 'current',
      created_at: now,
      prayer_updates: []
    };

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [samplePrayer], error: null })
    } as any;

    vi.mocked(supabase.from).mockReturnValue(chain);

    const fakeDoc = {
      open: vi.fn(),
      write: vi.fn(),
      close: vi.fn()
    } as any;

    const fakeWin: any = { document: fakeDoc, focus: vi.fn() };

    const mod = await import('../printablePrayerList');
    await mod.downloadPrintablePrayerList('twoweeks', fakeWin as any);

    expect(fakeDoc.write).toHaveBeenCalled();
    const written = (fakeDoc.write as any).mock.calls[0][0] as string;
    expect(written).toContain('Two Week Prayer');
  });

  it('sorts prayers by recent activity when they have updates', async () => {
    const now = new Date().toISOString();
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
    
    const prayers = [
      {
        id: 'p1',
        title: 'Old Prayer',
        prayer_for: 'Sorting Test 1',
        description: 'Created 2 days ago, no updates',
        requester: 'Alice',
        status: 'current',
        created_at: twoDaysAgo,
        prayer_updates: []
      },
      {
        id: 'p2',
        title: 'Recent Update',
        prayer_for: 'Sorting Test 2',
        description: 'Created 2 days ago but updated 1 hour ago',
        requester: 'Bob',
        status: 'current',
        created_at: twoDaysAgo,
        prayer_updates: [
          { id: 'u1', content: 'Recent update', author: 'Bob', created_at: oneHourAgo }
        ]
      },
      {
        id: 'p3',
        title: 'Brand New',
        prayer_for: 'Sorting Test 3',
        description: 'Just created',
        requester: 'Charlie',
        status: 'current',
        created_at: now,
        prayer_updates: []
      }
    ];

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: prayers, error: null })
    } as any;

    vi.mocked(supabase.from).mockReturnValue(chain);

    const fakeDoc = {
      open: vi.fn(),
      write: vi.fn(),
      close: vi.fn()
    } as any;

    const fakeWin: any = { document: fakeDoc, focus: vi.fn() };

    const mod = await import('../printablePrayerList');
    await mod.downloadPrintablePrayerList('month', fakeWin as any);

    const written = (fakeDoc.write as any).mock.calls[0][0] as string;
    // Should be sorted by most recent activity
    const brandNewIndex = written.indexOf('Brand New');
    const recentUpdateIndex = written.indexOf('Recent Update');
    const oldPrayerIndex = written.indexOf('Old Prayer');
    
    // Brand new (just created) should come first
    expect(brandNewIndex).toBeLessThan(recentUpdateIndex);
    // Recent update should come before old prayer with no updates
    expect(recentUpdateIndex).toBeLessThan(oldPrayerIndex);
  });

  it('handles answered prayers with date_answered field', async () => {
    const now = new Date().toISOString();
    const answeredDate = new Date(Date.now() - 86400000).toISOString();
    
    const prayer = {
      id: 'p1',
      title: 'Answered Prayer',
      prayer_for: 'Thanksgiving',
      description: 'This prayer was answered',
      requester: 'David',
      status: 'answered',
      created_at: answeredDate,
      date_answered: answeredDate,
      prayer_updates: [
        { id: 'u1', content: 'God answered!', author: 'David', created_at: answeredDate }
      ]
    };

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [prayer], error: null })
    } as any;

    vi.mocked(supabase.from).mockReturnValue(chain);

    const fakeDoc = {
      open: vi.fn(),
      write: vi.fn(),
      close: vi.fn()
    } as any;

    const fakeWin: any = { document: fakeDoc, focus: vi.fn() };

    const mod = await import('../printablePrayerList');
    await mod.downloadPrintablePrayerList('month', fakeWin as any);

    const written = (fakeDoc.write as any).mock.calls[0][0] as string;
    expect(written).toContain('Answered Prayer');
    expect(written).toContain('Thanksgiving');
    expect(written).toContain('God answered!');
    expect(written).toContain('Answered Prayers');
  });

  it('properly escapes HTML in prayer content', async () => {
    const now = new Date().toISOString();
    
    const prayer = {
      id: 'p1',
      title: '<script>alert("XSS")</script>',
      prayer_for: 'Security <b>Test</b>',
      description: 'Contains & special < characters > that need escaping',
      requester: 'Hacker & Friend',
      status: 'current',
      created_at: now,
      prayer_updates: [
        { 
          id: 'u1', 
          content: '<img src=x onerror=alert(1)>', 
          author: 'Author & Co', 
          created_at: now 
        }
      ]
    };

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [prayer], error: null })
    } as any;

    vi.mocked(supabase.from).mockReturnValue(chain);

    const fakeDoc = {
      open: vi.fn(),
      write: vi.fn(),
      close: vi.fn()
    } as any;

    const fakeWin: any = { document: fakeDoc, focus: vi.fn() };

    const mod = await import('../printablePrayerList');
    await mod.downloadPrintablePrayerList('month', fakeWin as any);

    const written = (fakeDoc.write as any).mock.calls[0][0] as string;
    
    // Should not contain raw script tags or malicious HTML
    expect(written).not.toContain('<script>');
    expect(written).not.toContain('onerror=alert');
    
    // Should contain escaped versions
    expect(written).toContain('&lt;');
    expect(written).toContain('&gt;');
    expect(written).toContain('&amp;');
  });

  it('handles multiple prayers with mixed current and answered statuses', async () => {
    const now = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    
    const prayers = [
      {
        id: 'p1',
        title: 'Current 1',
        prayer_for: 'Health',
        description: 'Current prayer 1',
        requester: 'Alice',
        status: 'current',
        created_at: now,
        prayer_updates: []
      },
      {
        id: 'p2',
        title: 'Answered 1',
        prayer_for: 'Job',
        description: 'Answered prayer 1',
        requester: 'Bob',
        status: 'answered',
        created_at: yesterday,
        date_answered: yesterday,
        prayer_updates: []
      },
      {
        id: 'p3',
        title: 'Current 2',
        prayer_for: 'Family',
        description: 'Current prayer 2',
        requester: 'Charlie',
        status: 'current',
        created_at: yesterday,
        prayer_updates: []
      },
      {
        id: 'p4',
        title: 'Answered 2',
        prayer_for: 'Healing',
        description: 'Answered prayer 2',
        requester: 'David',
        status: 'answered',
        created_at: yesterday,
        date_answered: now,
        prayer_updates: []
      }
    ];

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: prayers, error: null })
    } as any;

    vi.mocked(supabase.from).mockReturnValue(chain);

    const fakeDoc = {
      open: vi.fn(),
      write: vi.fn(),
      close: vi.fn()
    } as any;

    const fakeWin: any = { document: fakeDoc, focus: vi.fn() };

    const mod = await import('../printablePrayerList');
    await mod.downloadPrintablePrayerList('month', fakeWin as any);

    const written = (fakeDoc.write as any).mock.calls[0][0] as string;
    
    // Verify both sections exist
    expect(written).toContain('Current Prayers');
    expect(written).toContain('Answered Prayers');
    
    // Verify all prayers are included
    expect(written).toContain('Current 1');
    expect(written).toContain('Current 2');
    expect(written).toContain('Answered 1');
    expect(written).toContain('Answered 2');
    
    // Verify grouped correctly (Current Prayers section should come before Answered Prayers)
    const currentIndex = written.indexOf('Current Prayers');
    const answeredIndex = written.indexOf('Answered Prayers');
    expect(currentIndex).toBeLessThan(answeredIndex);
  });

  it('handles prayers with multiple updates sorted by date', async () => {
    const now = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
    
    const prayer = {
      id: 'p1',
      title: 'Prayer with Updates',
      prayer_for: 'Update Test',
      description: 'Prayer with multiple updates',
      requester: 'Emily',
      status: 'current',
      created_at: twoDaysAgo,
      prayer_updates: [
        { id: 'u1', content: 'First update', author: 'Emily', created_at: twoDaysAgo },
        { id: 'u2', content: 'Second update', author: 'Emily', created_at: yesterday },
        { id: 'u3', content: 'Latest update', author: 'Emily', created_at: now }
      ]
    };

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [prayer], error: null })
    } as any;

    vi.mocked(supabase.from).mockReturnValue(chain);

    const fakeDoc = {
      open: vi.fn(),
      write: vi.fn(),
      close: vi.fn()
    } as any;

    const fakeWin: any = { document: fakeDoc, focus: vi.fn() };

    const mod = await import('../printablePrayerList');
    await mod.downloadPrintablePrayerList('month', fakeWin as any);

    const written = (fakeDoc.write as any).mock.calls[0][0] as string;
    
    // Verify all updates are included
    expect(written).toContain('First update');
    expect(written).toContain('Second update');
    expect(written).toContain('Latest update');
    
    // Verify they are in the correct order (newest first)
    const latestIndex = written.indexOf('Latest update');
    const secondIndex = written.indexOf('Second update');
    const firstIndex = written.indexOf('First update');
    
    expect(latestIndex).toBeLessThan(secondIndex);
    expect(secondIndex).toBeLessThan(firstIndex);
  });
});
