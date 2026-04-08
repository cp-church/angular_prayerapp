import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { driver } from 'driver.js';
import {
  FULL_GUIDED_TOUR_CLOSING_SENTINEL,
  HelpDriverTourService,
  parseFullGuidedTourQueue,
  TOUR_REQUEST_BTN_MOBILE_ID,
  TOUR_REQUEST_BTN_DESKTOP_ID,
  TOUR_FILTER_PERSONAL_ID,
  TOUR_ADD_UPDATE_BTN_ID,
  TOUR_FILTER_CURRENT_ID,
  TOUR_FILTER_TOTAL_ID,
  TOUR_FILTER_ANSWERED_ID,
  TOUR_FILTER_PROMPTS_ID,
  TOUR_PRAYER_MODE_DESKTOP_ID,
  TOUR_PRAYER_MODE_MOBILE_ID,
  TOUR_PRAYER_SEARCH_ID,
} from './help-driver-tour.service';
import type { HelpContent } from '../types/help-content';

vi.mock('driver.js', () => ({
  driver: vi.fn(),
}));

const sampleHelp: HelpContent = {
  subtitle: 'Creating a New Prayer Request',
  text: 'Click the Request button in the header to create a new prayer request.',
  examples: [],
};

const samplePersonalHelp: HelpContent = {
  subtitle: 'Creating Personal Prayers (Private Prayers)',
  text: 'Click the filter button labeled Personal to view your private prayers.',
  examples: [],
};

const sampleUpdatingHelp: HelpContent = {
  subtitle: 'Updating Prayers',
  text: 'Click the Update button to add an update about the prayer request.',
  examples: [],
};

const sampleManagingViewsHelp: HelpContent = {
  subtitle: 'Managing Personal vs. Regular Prayers',
  text: 'Use the Personal filter for private prayers and Current or Total for community.',
  examples: [],
};

describe('HelpDriverTourService', () => {
  let service: HelpDriverTourService;
  let openPrayerForm: ReturnType<typeof vi.fn>;
  let switchToPersonalFilter: ReturnType<typeof vi.fn>;
  let switchToPersonal: ReturnType<typeof vi.fn>;
  let switchToCurrent: ReturnType<typeof vi.fn>;
  let switchToAnswered: ReturnType<typeof vi.fn>;
  let switchToTotal: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    service = new HelpDriverTourService();
    openPrayerForm = vi.fn();
    switchToPersonalFilter = vi.fn();
    switchToPersonal = vi.fn();
    switchToCurrent = vi.fn();
    switchToAnswered = vi.fn();
    switchToTotal = vi.fn();
    vi.mocked(driver).mockImplementation(
      () =>
        ({
          drive: vi.fn(),
          destroy: vi.fn(),
          refresh: vi.fn(),
          moveNext: vi.fn(),
        }) as ReturnType<typeof driver>
    );
  });

  afterEach(() => {
    service.destroy();
    document.body.innerHTML = '';
  });

  it('full guided welcome: programmatic destroy() runs onDestroyed with callback still set (Begin path)', () => {
    const onBegin = vi.fn();
    let savedConfig: { steps?: unknown[]; onDestroyed?: (e: unknown, s: unknown, o: unknown) => void } | undefined;
    vi.mocked(driver).mockImplementation((cfg) => {
      savedConfig = cfg as typeof savedConfig;
      return {
        drive: vi.fn(),
        destroy: vi.fn(),
        refresh: vi.fn(),
        moveNext: vi.fn(),
      } as ReturnType<typeof driver>;
    });
    vi.useFakeTimers();
    service.startFullGuidedTourWelcome(onBegin, { totalSteps: 3 });
    expect(savedConfig?.steps?.length).toBe(1);
    savedConfig?.onDestroyed?.(undefined, undefined, {
      config: { steps: savedConfig?.steps ?? [] },
      state: { activeIndex: 0 },
      driver: {},
    });
    vi.runAllTimers();
    expect(onBegin).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('does not call driver when no Request button exists', () => {
    service.startNewPrayerRequestTour(sampleHelp, { openPrayerForm });
    expect(driver).not.toHaveBeenCalled();
  });

  it('starts tour when a Request button exists (desktop id)', () => {
    const btn = document.createElement('button');
    btn.id = TOUR_REQUEST_BTN_DESKTOP_ID;
    document.body.appendChild(btn);
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    );

    service.startNewPrayerRequestTour(sampleHelp, { openPrayerForm });

    expect(driver).toHaveBeenCalledTimes(1);
    const config = vi.mocked(driver).mock.calls[0][0];
    expect(config?.steps?.length).toBe(6);
    expect(config?.showProgress).toBe(true);

    const instance = vi.mocked(driver).mock.results[0]?.value as { drive: ReturnType<typeof vi.fn> };
    expect(instance.drive).toHaveBeenCalledWith(0);

    vi.unstubAllGlobals();
  });

  it('open form hook runs from step 0 onNextClick then refreshes and advances', () => {
    const btn = document.createElement('button');
    btn.id = TOUR_REQUEST_BTN_MOBILE_ID;
    document.body.appendChild(btn);
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    );

    const refresh = vi.fn();
    const moveNext = vi.fn();
    vi.mocked(driver).mockImplementation(
      () =>
        ({
          drive: vi.fn(),
          destroy: vi.fn(),
          refresh,
          moveNext,
        }) as ReturnType<typeof driver>
    );

    vi.useFakeTimers();
    service.startNewPrayerRequestTour(sampleHelp, { openPrayerForm });
    const config = vi.mocked(driver).mock.calls[0][0];
    const hook = config?.steps?.[0]?.popover?.onNextClick;
    const mockDriver = { refresh, moveNext };
    hook?.(document.body, config!.steps![0]!, {
      config: config!,
      state: {} as any,
      driver: mockDriver as any,
    });

    expect(openPrayerForm).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(250);
    expect(refresh).toHaveBeenCalled();
    expect(moveNext).toHaveBeenCalled();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('destroy is safe when no active tour', () => {
    expect(() => service.destroy()).not.toThrow();
  });

  it('starting again destroys previous driver instance', () => {
    const btn = document.createElement('button');
    btn.id = TOUR_REQUEST_BTN_DESKTOP_ID;
    document.body.appendChild(btn);
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    );

    const destroyA = vi.fn();
    const destroyB = vi.fn();
    vi.mocked(driver)
      .mockImplementationOnce(
        () => ({ drive: vi.fn(), destroy: destroyA, refresh: vi.fn(), moveNext: vi.fn() }) as ReturnType<
          typeof driver
        >
      )
      .mockImplementationOnce(
        () => ({ drive: vi.fn(), destroy: destroyB, refresh: vi.fn(), moveNext: vi.fn() }) as ReturnType<
          typeof driver
        >
      );

    service.startNewPrayerRequestTour(sampleHelp, { openPrayerForm });
    service.startNewPrayerRequestTour(sampleHelp, { openPrayerForm });

    expect(destroyA).toHaveBeenCalledTimes(1);
    expect(driver).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  describe('startPersonalPrayerTour', () => {
    function mountFilterAndRequest() {
      const filterBtn = document.createElement('button');
      filterBtn.id = TOUR_FILTER_PERSONAL_ID;
      document.body.appendChild(filterBtn);
      const req = document.createElement('button');
      req.id = TOUR_REQUEST_BTN_DESKTOP_ID;
      document.body.appendChild(req);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
      );
    }

    it('does not call driver when Personal filter element is missing', () => {
      const req = document.createElement('button');
      req.id = TOUR_REQUEST_BTN_DESKTOP_ID;
      document.body.appendChild(req);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
      );
      service.startPersonalPrayerTour(samplePersonalHelp, {
        switchToPersonalFilter,
        openPrayerForm,
      });
      expect(driver).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('does not call driver when Request button is missing', () => {
      const filterBtn = document.createElement('button');
      filterBtn.id = TOUR_FILTER_PERSONAL_ID;
      document.body.appendChild(filterBtn);
      service.startPersonalPrayerTour(samplePersonalHelp, {
        switchToPersonalFilter,
        openPrayerForm,
      });
      expect(driver).not.toHaveBeenCalled();
    });

    it('starts tour when filter and Request exist', () => {
      mountFilterAndRequest();
      service.startPersonalPrayerTour(samplePersonalHelp, {
        switchToPersonalFilter,
        openPrayerForm,
      });
      expect(driver).toHaveBeenCalledTimes(1);
      const config = vi.mocked(driver).mock.calls[0][0];
      expect(config?.steps?.length).toBe(6);
      vi.unstubAllGlobals();
    });

    it('step 0 onNext runs switchToPersonalFilter then refresh and moveNext', () => {
      mountFilterAndRequest();
      const refresh = vi.fn();
      const moveNext = vi.fn();
      vi.mocked(driver).mockImplementation(
        () =>
          ({
            drive: vi.fn(),
            destroy: vi.fn(),
            refresh,
            moveNext,
          }) as ReturnType<typeof driver>
      );
      vi.useFakeTimers();
      service.startPersonalPrayerTour(samplePersonalHelp, {
        switchToPersonalFilter,
        openPrayerForm,
      });
      const config = vi.mocked(driver).mock.calls[0][0];
      const hook = config?.steps?.[0]?.popover?.onNextClick;
      hook?.(document.body, config!.steps![0]!, {
        config: config!,
        state: {} as any,
        driver: { refresh, moveNext } as any,
      });
      expect(switchToPersonalFilter).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(250);
      expect(refresh).toHaveBeenCalled();
      expect(moveNext).toHaveBeenCalled();
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });
  });

  describe('startUpdatingPrayerTour', () => {
    it('does not call driver when Add Update anchor is missing', () => {
      service.startUpdatingPrayerTour(sampleUpdatingHelp);
      expect(driver).not.toHaveBeenCalled();
    });

    it('starts with 4 steps when anonymous step is excluded', () => {
      const btn = document.createElement('button');
      btn.id = TOUR_ADD_UPDATE_BTN_ID;
      document.body.appendChild(btn);

      service.startUpdatingPrayerTour(sampleUpdatingHelp, { includeAnonymousUpdateStep: false });

      expect(driver).toHaveBeenCalledTimes(1);
      const config = vi.mocked(driver).mock.calls[0][0];
      expect(config?.steps?.length).toBe(4);
    });

    it('starts with 5 steps when anonymous step is included', () => {
      const btn = document.createElement('button');
      btn.id = TOUR_ADD_UPDATE_BTN_ID;
      document.body.appendChild(btn);

      service.startUpdatingPrayerTour(sampleUpdatingHelp, { includeAnonymousUpdateStep: true });

      const config = vi.mocked(driver).mock.calls[0][0];
      expect(config?.steps?.length).toBe(5);
    });

    it('step 0 onNext clicks Add Update then refresh and moveNext', () => {
      const btn = document.createElement('button');
      btn.id = TOUR_ADD_UPDATE_BTN_ID;
      const clickSpy = vi.spyOn(btn, 'click');
      document.body.appendChild(btn);

      const refresh = vi.fn();
      const moveNext = vi.fn();
      vi.mocked(driver).mockImplementation(
        () =>
          ({
            drive: vi.fn(),
            destroy: vi.fn(),
            refresh,
            moveNext,
          }) as ReturnType<typeof driver>
      );

      vi.useFakeTimers();
      service.startUpdatingPrayerTour(sampleUpdatingHelp, { includeAnonymousUpdateStep: false });
      const config = vi.mocked(driver).mock.calls[0][0];
      const hook = config?.steps?.[0]?.popover?.onNextClick;
      hook?.(document.body, config!.steps![0]!, {
        config: config!,
        state: {} as any,
        driver: { refresh, moveNext } as any,
      });

      expect(clickSpy).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(300);
      expect(refresh).toHaveBeenCalled();
      expect(moveNext).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('startManagingPrayerViewsTour', () => {
    const managingHooks = () => ({
      switchToCurrent,
      switchToAnswered,
      switchToTotal,
    });

    function mountFourFilters() {
      const personal = document.createElement('button');
      personal.id = TOUR_FILTER_PERSONAL_ID;
      document.body.appendChild(personal);
      const current = document.createElement('button');
      current.id = TOUR_FILTER_CURRENT_ID;
      document.body.appendChild(current);
      const answered = document.createElement('button');
      answered.id = TOUR_FILTER_ANSWERED_ID;
      document.body.appendChild(answered);
      const total = document.createElement('button');
      total.id = TOUR_FILTER_TOTAL_ID;
      document.body.appendChild(total);
    }

    it('does not call driver when Answered filter element is missing', () => {
      const personal = document.createElement('button');
      personal.id = TOUR_FILTER_PERSONAL_ID;
      document.body.appendChild(personal);
      const current = document.createElement('button');
      current.id = TOUR_FILTER_CURRENT_ID;
      document.body.appendChild(current);
      const total = document.createElement('button');
      total.id = TOUR_FILTER_TOTAL_ID;
      document.body.appendChild(total);
      service.startManagingPrayerViewsTour(sampleManagingViewsHelp, managingHooks());
      expect(driver).not.toHaveBeenCalled();
    });

    it('starts tour when Personal, Current, Answered, and Total exist', () => {
      mountFourFilters();
      service.startManagingPrayerViewsTour(sampleManagingViewsHelp, managingHooks());
      expect(driver).toHaveBeenCalledTimes(1);
      const config = vi.mocked(driver).mock.calls[0][0];
      expect(config?.steps?.length).toBe(4);
    });

    it('step 0 onNext runs switchToCurrent then refresh and moveNext', () => {
      mountFourFilters();
      const refresh = vi.fn();
      const moveNext = vi.fn();
      vi.mocked(driver).mockImplementation(
        () =>
          ({
            drive: vi.fn(),
            destroy: vi.fn(),
            refresh,
            moveNext,
          }) as ReturnType<typeof driver>
      );
      vi.useFakeTimers();
      service.startManagingPrayerViewsTour(sampleManagingViewsHelp, managingHooks());
      const config = vi.mocked(driver).mock.calls[0][0];
      const hook = config?.steps?.[0]?.popover?.onNextClick;
      hook?.(document.body, config!.steps![0]!, {
        config: config!,
        state: {} as any,
        driver: { refresh, moveNext } as any,
      });
      expect(switchToCurrent).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(250);
      expect(refresh).toHaveBeenCalled();
      expect(moveNext).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('step 1 onNext runs switchToAnswered', () => {
      mountFourFilters();
      const refresh = vi.fn();
      const moveNext = vi.fn();
      vi.mocked(driver).mockImplementation(
        () =>
          ({
            drive: vi.fn(),
            destroy: vi.fn(),
            refresh,
            moveNext,
          }) as ReturnType<typeof driver>
      );
      vi.useFakeTimers();
      service.startManagingPrayerViewsTour(sampleManagingViewsHelp, managingHooks());
      const config = vi.mocked(driver).mock.calls[0][0];
      const hook = config?.steps?.[1]?.popover?.onNextClick;
      hook?.(document.body, config!.steps![1]!, {
        config: config!,
        state: {} as any,
        driver: { refresh, moveNext } as any,
      });
      expect(switchToAnswered).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(250);
      expect(refresh).toHaveBeenCalled();
      expect(moveNext).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('step 2 onNext runs switchToTotal', () => {
      mountFourFilters();
      const refresh = vi.fn();
      const moveNext = vi.fn();
      vi.mocked(driver).mockImplementation(
        () =>
          ({
            drive: vi.fn(),
            destroy: vi.fn(),
            refresh,
            moveNext,
          }) as ReturnType<typeof driver>
      );
      vi.useFakeTimers();
      service.startManagingPrayerViewsTour(sampleManagingViewsHelp, managingHooks());
      const config = vi.mocked(driver).mock.calls[0][0];
      const hook = config?.steps?.[2]?.popover?.onNextClick;
      hook?.(document.body, config!.steps![2]!, {
        config: config!,
        state: {} as any,
        driver: { refresh, moveNext } as any,
      });
      expect(switchToTotal).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(250);
      expect(refresh).toHaveBeenCalled();
      expect(moveNext).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('startPrayerPromptsTour', () => {
    const samplePromptsSection = { title: 'Using Prayer Prompts', description: 'Get inspired with our prayer prompts' };

    function mountPrayerModeButtons() {
      const desk = document.createElement('button');
      desk.id = TOUR_PRAYER_MODE_DESKTOP_ID;
      document.body.appendChild(desk);
      const mob = document.createElement('button');
      mob.id = TOUR_PRAYER_MODE_MOBILE_ID;
      document.body.appendChild(mob);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
      );
    }

    it('does not call driver when prompts filter tile is missing', () => {
      mountPrayerModeButtons();
      service.startPrayerPromptsTour(
        samplePromptsSection,
        { hasPrompts: false },
        { switchToPrompts: vi.fn(), clearPromptTypes: vi.fn() }
      );
      expect(driver).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('does not call driver when Prayer mode buttons are missing', () => {
      const pf = document.createElement('button');
      pf.id = TOUR_FILTER_PROMPTS_ID;
      document.body.appendChild(pf);
      service.startPrayerPromptsTour(
        samplePromptsSection,
        { hasPrompts: false },
        { switchToPrompts: vi.fn(), clearPromptTypes: vi.fn() }
      );
      expect(driver).not.toHaveBeenCalled();
    });

    it('starts with 3 steps when hasPrompts is false', () => {
      const pf = document.createElement('button');
      pf.id = TOUR_FILTER_PROMPTS_ID;
      document.body.appendChild(pf);
      mountPrayerModeButtons();
      service.startPrayerPromptsTour(
        samplePromptsSection,
        { hasPrompts: false },
        { switchToPrompts: vi.fn(), clearPromptTypes: vi.fn() }
      );
      expect(driver).toHaveBeenCalledTimes(1);
      const config = vi.mocked(driver).mock.calls[0][0];
      expect(config?.steps?.length).toBe(3);
      vi.unstubAllGlobals();
    });

    it('starts with 4 steps when hasPrompts is true', () => {
      const pf = document.createElement('button');
      pf.id = TOUR_FILTER_PROMPTS_ID;
      document.body.appendChild(pf);
      mountPrayerModeButtons();
      service.startPrayerPromptsTour(
        samplePromptsSection,
        { hasPrompts: true },
        { switchToPrompts: vi.fn(), clearPromptTypes: vi.fn() }
      );
      expect(driver).toHaveBeenCalledTimes(1);
      const config = vi.mocked(driver).mock.calls[0][0];
      expect(config?.steps?.length).toBe(4);
      vi.unstubAllGlobals();
    });

    it('step 0 onNext runs switchToPrompts then refresh and moveNext', () => {
      const pf = document.createElement('button');
      pf.id = TOUR_FILTER_PROMPTS_ID;
      document.body.appendChild(pf);
      mountPrayerModeButtons();
      const switchToPrompts = vi.fn();
      const refresh = vi.fn();
      const moveNext = vi.fn();
      vi.mocked(driver).mockImplementation(
        () =>
          ({
            drive: vi.fn(),
            destroy: vi.fn(),
            refresh,
            moveNext,
          }) as ReturnType<typeof driver>
      );
      vi.useFakeTimers();
      service.startPrayerPromptsTour(
        samplePromptsSection,
        { hasPrompts: false },
        { switchToPrompts, clearPromptTypes: vi.fn() }
      );
      const config = vi.mocked(driver).mock.calls[0][0];
      const hook = config?.steps?.[0]?.popover?.onNextClick;
      hook?.(document.body, config!.steps![0]!, {
        config: config!,
        state: {} as any,
        driver: { refresh, moveNext } as any,
      });
      expect(switchToPrompts).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(250);
      expect(refresh).toHaveBeenCalled();
      expect(moveNext).toHaveBeenCalled();
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });
  });

  describe('startPrayerEncouragementTour', () => {
    const sampleEncouragementSection = {
      title: 'Prayer Encouragement (Pray For)',
      description: 'Encourage others by marking when you pray',
    };

    it('does not call driver when Current filter tile is missing', () => {
      service.startPrayerEncouragementTour(
        sampleEncouragementSection,
        { hasCommunityPrayer: false },
        { switchToCurrent: vi.fn() }
      );
      expect(driver).not.toHaveBeenCalled();
    });

    it('starts with 2 steps when hasCommunityPrayer is false', () => {
      const cur = document.createElement('button');
      cur.id = TOUR_FILTER_CURRENT_ID;
      document.body.appendChild(cur);
      service.startPrayerEncouragementTour(
        sampleEncouragementSection,
        { hasCommunityPrayer: false },
        { switchToCurrent: vi.fn() }
      );
      expect(driver).toHaveBeenCalledTimes(1);
      const config = vi.mocked(driver).mock.calls[0][0];
      expect(config?.steps?.length).toBe(2);
      expect(config?.steps?.[1]?.element).toBeUndefined();
    });

    it('starts with 3 steps when hasCommunityPrayer is true', () => {
      const cur = document.createElement('button');
      cur.id = TOUR_FILTER_CURRENT_ID;
      document.body.appendChild(cur);
      service.startPrayerEncouragementTour(
        sampleEncouragementSection,
        { hasCommunityPrayer: true },
        { switchToCurrent: vi.fn() }
      );
      expect(driver).toHaveBeenCalledTimes(1);
      const config = vi.mocked(driver).mock.calls[0][0];
      expect(config?.steps?.length).toBe(3);
      expect(config?.steps?.[2]?.element).toBeUndefined();
    });

    it('step 0 onNext runs switchToCurrent then refresh and moveNext', () => {
      const cur = document.createElement('button');
      cur.id = TOUR_FILTER_CURRENT_ID;
      document.body.appendChild(cur);
      const switchToCurrent = vi.fn();
      const refresh = vi.fn();
      const moveNext = vi.fn();
      vi.mocked(driver).mockImplementation(
        () =>
          ({
            drive: vi.fn(),
            destroy: vi.fn(),
            refresh,
            moveNext,
          }) as ReturnType<typeof driver>
      );
      vi.useFakeTimers();
      service.startPrayerEncouragementTour(
        sampleEncouragementSection,
        { hasCommunityPrayer: false },
        { switchToCurrent }
      );
      const config = vi.mocked(driver).mock.calls[0][0];
      const hook = config?.steps?.[0]?.popover?.onNextClick;
      hook?.(document.body, config!.steps![0]!, {
        config: config!,
        state: {} as any,
        driver: { refresh, moveNext } as any,
      });
      expect(switchToCurrent).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(250);
      expect(refresh).toHaveBeenCalled();
      expect(moveNext).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('startSearchPrayersTour', () => {
    const sampleSearchSection = { title: 'Searching Prayers', description: 'Find prayers using search' };

    it('does not call driver when search input is missing', () => {
      service.startSearchPrayersTour(sampleSearchSection);
      expect(driver).not.toHaveBeenCalled();
    });

    it('starts with 2 steps; second step is popover-only', () => {
      const input = document.createElement('input');
      input.id = TOUR_PRAYER_SEARCH_ID;
      document.body.appendChild(input);
      service.startSearchPrayersTour(sampleSearchSection);
      expect(driver).toHaveBeenCalledTimes(1);
      const config = vi.mocked(driver).mock.calls[0][0];
      expect(config?.steps?.length).toBe(2);
      expect(config?.steps?.[0]?.element).toBeDefined();
      expect(config?.steps?.[1]?.element).toBeUndefined();
    });
  });

  describe('startFilteringHelpSectionTour', () => {
    const switchToPrompts = vi.fn();

    const filteringSection = {
      id: 'help_filtering',
      title: 'Filtering Prayers',
      description: 'Filter and sort your prayers',
      icon: '',
      order: 6,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      content: [
        {
          subtitle: 'Filter Options',
          text: 'Use filters: "Current" shows active, "Answered" shows answered ones, "Total" shows all, "Prompts" displays cards, and "Personal" shows private.',
          examples: [] as string[],
        },
        { subtitle: 'Personal Prayers Filter', text: 'Personal help body.', examples: [] },
        { subtitle: 'Finding Archived Prayers', text: 'Total help body.', examples: [] },
        { subtitle: 'Search Across All Filters', text: 'Search help body.', examples: [] },
      ],
    };

    it('does not call driver when Current filter element is missing', () => {
      service.startFilteringHelpSectionTour(filteringSection as any, {
        switchToCurrent,
        switchToAnswered,
        switchToTotal,
        switchToPrompts,
        switchToPersonal: switchToPersonalFilter,
      });
      expect(driver).not.toHaveBeenCalled();
    });

    it('starts tour when Current filter exists', () => {
      const cur = document.createElement('button');
      cur.id = TOUR_FILTER_CURRENT_ID;
      document.body.appendChild(cur);
      service.startFilteringHelpSectionTour(filteringSection as any, {
        switchToCurrent,
        switchToAnswered,
        switchToTotal,
        switchToPrompts,
        switchToPersonal: switchToPersonalFilter,
      });
      expect(driver).toHaveBeenCalledTimes(1);
      const config = vi.mocked(driver).mock.calls[0][0];
      expect(config?.steps?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('startPersonalPrayersHelpSectionTour', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }))
      );
    });

    const sampleSection = { title: 'Personal Prayers', description: 'Manage private prayers' };
    const handsOnHooks = {
      switchToPersonalFilter: vi.fn(),
      openPrayerForm: vi.fn(),
      markForCheck: vi.fn(),
      fillWalkthroughPrayerFor: vi.fn(),
      fillWalkthroughDescription: vi.fn(),
      ensureWalkthroughPersonalSelected: vi.fn(),
      fillWalkthroughCategory: vi.fn(),
      submitWalkthroughPrayerForm: vi.fn(),
      openWalkthroughPersonalEdit: vi.fn(),
      closeWalkthroughPersonalEdit: vi.fn(),
      clickWalkthroughAddUpdate: vi.fn(),
      narrowToWalkthroughCategoryFilter: vi.fn(),
      deleteWalkthroughTestPrayer: vi.fn(),
    };

    it('does not call driver when Request button is missing', () => {
      const tile = document.createElement('button');
      tile.id = TOUR_FILTER_PERSONAL_ID;
      document.body.appendChild(tile);
      service.startPersonalPrayersHelpSectionTour(sampleSection, handsOnHooks);
      expect(driver).not.toHaveBeenCalled();
    });

    it('starts hands-on walkthrough when Request and Personal filter exist (16 steps)', () => {
      const req = document.createElement('button');
      req.id = TOUR_REQUEST_BTN_MOBILE_ID;
      document.body.appendChild(req);
      const tile = document.createElement('button');
      tile.id = TOUR_FILTER_PERSONAL_ID;
      document.body.appendChild(tile);
      service.startPersonalPrayersHelpSectionTour(sampleSection, handsOnHooks);
      expect(driver).toHaveBeenCalledTimes(1);
      const config = vi.mocked(driver).mock.calls[0][0];
      expect(config?.steps?.length).toBe(16);
      expect(config?.steps?.[0]?.element).toBeUndefined();
    });
  });
});

describe('parseFullGuidedTourQueue', () => {
  it('parses legacy closing sentinel array', () => {
    expect(parseFullGuidedTourQueue(JSON.stringify([FULL_GUIDED_TOUR_CLOSING_SENTINEL]))).toEqual({
      kind: 'legacy_closing',
    });
  });

  it('parses legacy section ids', () => {
    expect(parseFullGuidedTourQueue(JSON.stringify(['help_a', 'help_b']))).toEqual({
      kind: 'legacy_section_ids',
      ids: ['help_a', 'help_b'],
    });
  });

  it('parses v1 closing', () => {
    expect(parseFullGuidedTourQueue(JSON.stringify({ v: 1, mode: 'closing', totalSteps: 5 }))).toEqual({
      kind: 'closing',
      totalSteps: 5,
    });
  });

  it('parses v1 resume with resume index', () => {
    expect(
      parseFullGuidedTourQueue(
        JSON.stringify({
          v: 1,
          totalSteps: 8,
          ids: ['help_settings'],
          resumeStartGlobalSectionIndex: 6,
        })
      )
    ).toEqual({
      kind: 'resume',
      ids: ['help_settings'],
      totalSteps: 8,
      resumeStartGlobalSectionIndex: 6,
    });
  });

  it('returns empty for invalid json', () => {
    expect(parseFullGuidedTourQueue('not json')).toEqual({ kind: 'empty' });
  });
});
