export type BibleTranslation = 'esv';

export function isBibleTranslation(
  value: string | null | undefined
): value is BibleTranslation {
  return value === 'esv';
}

/** ESV has passage-level streaming audio for memorize listen mode. */
export function isMemorizationListenTranslation(translation: BibleTranslation): boolean {
  return translation === 'esv';
}

export type MemorizationMasterLevel = 'learning' | 'practicing' | 'mastered';

export interface MemorizationPracticeSessionRecord {
  date: number;
  wrongAttempts: number;
  correctKeystrokes: number;
  completed: boolean;
}

export type MemorizationInProgressPhase =
  | { kind: 'betweenRounds'; completedRoundIndex: number }
  | { kind: 'inRound'; roundIndex: number };

export type MemorizationPracticeMode =
  | 'type'
  | 'word'
  | 'reorder'
  | 'firstLetters';

export interface MemorizationInProgress {
  sessionSeed: string;
  wrongAttempts: number;
  correctKeystrokes: number;
  updatedAt: number;
  phase: MemorizationInProgressPhase;
  practiceMode?: MemorizationPracticeMode;
}

export type MemorizationInProgressSavePayload = Omit<
  MemorizationInProgress,
  'updatedAt'
>;

export type MemorizationItemKind = 'verse' | 'bibleBooks';

export type BibleBooksMemorizationScope = 'all' | 'ot' | 'nt';

export interface MemorizedItem {
  id: string;
  reference: string;
  /** Bible-books list text only; verse items keep `''` — ESV passages are fetched on demand. */
  text: string;
  translation: BibleTranslation;
  dateAdded: number;
  lastPracticedAt: number | null;
  practiceSessions: MemorizationPracticeSessionRecord[];
  inProgressPractice?: MemorizationInProgress | null;
  kind?: MemorizationItemKind;
  bibleBooksScope?: BibleBooksMemorizationScope;
}

export interface MemorizedItemRow {
  id: string;
  user_email: string;
  reference: string;
  text: string;
  translation: string;
  kind: MemorizationItemKind;
  bible_books_scope: BibleBooksMemorizationScope | null;
  date_added: string;
  last_practiced_at: string | null;
  practice_sessions: MemorizationPracticeSessionRecord[];
  in_progress_practice: MemorizationInProgress | null;
  created_at: string;
  updated_at: string;
}

/** Admin-curated category for Memorize recommendation verses. */
export interface MemorizationRecommendationCategory {
  id: string;
  name: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemorizationRecommendationCategoryRow {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** Admin-curated verse shown on the Memorize tab as a recommendation. */
export interface MemorizationRecommendation {
  id: string;
  reference: string;
  translation: BibleTranslation;
  categoryId: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemorizationRecommendationRow {
  id: string;
  reference: string;
  translation: string;
  category_id: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** Category with its verses, ordered for the Recommended modal / admin UI. */
export interface MemorizationRecommendationCategoryGroup {
  category: MemorizationRecommendationCategory;
  items: MemorizationRecommendation[];
}
