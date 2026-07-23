export type PresentationContentType =
  | 'prayers'
  | 'prompts'
  | 'personal'
  | 'members'
  | 'all';

export type SelectablePresentationContentType = Exclude<
  PresentationContentType,
  'all'
>;

export const SELECTABLE_CONTENT_TYPES: readonly SelectablePresentationContentType[] =
  ['prayers', 'prompts', 'personal', 'members'];

export function isSelectablePresentationContentType(
  value: unknown
): value is SelectablePresentationContentType {
  return (
    typeof value === 'string' &&
    (SELECTABLE_CONTENT_TYPES as readonly string[]).includes(value)
  );
}

export function includesPresentationContentType(
  types: SelectablePresentationContentType[],
  type: SelectablePresentationContentType
): boolean {
  return types.length === 0 || types.includes(type);
}

export function isPrayersOnlyContentTypes(
  types: SelectablePresentationContentType[]
): boolean {
  return types.length === 1 && types[0] === 'prayers';
}

export function showsPrayerTimeStatusFilters(
  types: SelectablePresentationContentType[]
): boolean {
  return (
    types.length === 0 ||
    types.includes('prayers') ||
    types.includes('personal')
  );
}

export function normalizeContentTypes(
  value: unknown
): SelectablePresentationContentType[] | null {
  if (Array.isArray(value)) {
    const types = value.filter(isSelectablePresentationContentType);
    return types;
  }

  if (typeof value === 'string' && isSelectablePresentationContentType(value)) {
    return [value];
  }

  if (value === 'all') {
    return [];
  }

  return null;
}

export type PresentationTimeFilter =
  | 'week'
  | 'twoweeks'
  | 'month'
  | 'year'
  | 'all';

export interface PresentationSettings {
  contentTypes: SelectablePresentationContentType[];
  randomize: boolean;
  smartMode: boolean;
  displayDuration: number;
  timeFilter: PresentationTimeFilter;
  statusFilters: { current: boolean; answered: boolean };
  prayerTimerMinutes: number;
}

export type HomePresentationFilter =
  | 'current'
  | 'answered'
  | 'total'
  | 'prompts'
  | 'personal'
  | 'memorize'
  | 'planning_center_list';

export type DefaultPrayerView = 'current' | 'personal';

/** Router `history.state` key for one-shot Home → Pray content-type handoff. */
export const PRESENTATION_HOME_NAV_STATE_KEY = 'presentationHomeContentTypes';

/** Query param when Pray opens presentation in a new tab (native link navigation). */
export const PRESENTATION_HOME_QUERY_PARAM_KEY = 'homeTypes';

export function serializePresentationHandoffQueryParam(
  contentTypes: SelectablePresentationContentType[]
): string | null {
  if (contentTypes.length === 0) {
    return null;
  }
  return contentTypes.join(',');
}

export function parsePresentationHandoffQueryParam(
  value: string | null | undefined
): SelectablePresentationContentType[] | null {
  if (!value) {
    return null;
  }
  const types = value
    .split(',')
    .map((part) => part.trim())
    .filter(isSelectablePresentationContentType);
  return types.length > 0 ? types : null;
}

export function parsePresentationHandoffContentTypes(
  value: unknown
): SelectablePresentationContentType[] | null {
  if (Array.isArray(value)) {
    const types = value.filter(isSelectablePresentationContentType);
    return types.length > 0 ? types : null;
  }

  if (typeof value === 'string' && isSelectablePresentationContentType(value)) {
    return [value];
  }

  return null;
}
