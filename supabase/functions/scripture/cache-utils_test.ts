import { assertEquals } from 'https://deno.land/std@0.224.0/assert/assert_equals.ts';
import {
  cacheVerseCount,
  verseCountFromReference,
  verseCountInEsvText,
} from './cache-utils.ts';

Deno.test('verseCountFromReference counts single verses', () => {
  assertEquals(verseCountFromReference('John 3:16'), 1);
});

Deno.test('verseCountFromReference counts verse ranges', () => {
  assertEquals(verseCountFromReference('Romans 8:28-30'), 3);
});

Deno.test('verseCountFromReference counts single-chapter books expanded to full chapter', () => {
  assertEquals(verseCountFromReference('Jude 1:1-25'), 25);
});

Deno.test('verseCountInEsvText counts numbered verse markers', () => {
  assertEquals(
    verseCountInEsvText('[1] In the beginning [2] And the earth was without form'),
    2
  );
});

Deno.test('cacheVerseCount uses the larger of reference and text estimates', () => {
  assertEquals(
    cacheVerseCount('John 3:16', '[16] For God so loved the world'),
    1
  );
  assertEquals(
    cacheVerseCount('Romans 8:28-30', '[28] And we know [29] For those whom [30] And those whom'),
    3
  );
});
