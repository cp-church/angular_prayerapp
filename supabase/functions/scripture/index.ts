import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.110.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

function esvCacheTtlDays(): number {
  return parseInt(Deno.env.get('ESV_CACHE_TTL_DAYS') || '7', 10);
}

function esvCacheMaxVerses(): number {
  return parseInt(Deno.env.get('ESV_CACHE_MAX_VERSES') || '500', 10);
}

function scriptureCacheCutoff(ttlDays: number): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ttlDays);
  return cutoff;
}

async function touchScriptureCache(
  supabase: SupabaseClient,
  cacheReference: string
): Promise<void> {
  await supabase
    .from('scripture_cache')
    .update({ cached_at: new Date().toISOString() })
    .eq('reference', cacheReference)
    .eq('translation', 'esv');
}

async function pruneScriptureCache(
  supabase: SupabaseClient,
  maxVerses: number,
  cutoff: Date
): Promise<void> {
  const { error } = await supabase.rpc('prune_scripture_cache', {
    p_max_verses: maxVerses,
    p_ttl_cutoff: cutoff.toISOString(),
  });
  if (error) {
    console.error('scripture_cache prune failed:', error.message);
  }
}

const SINGLE_CHAPTER_BOOK_VERSES = new Map<string, number>([
  ['obadiah', 21],
  ['philemon', 25],
  ['2 john', 13],
  ['3 john', 15],
  ['jude', 25],
]);

function parseReference(
  reference: string
): { book: string; chapter: number; verseStart: number | null; verseEnd: number | null } | null {
  const normalized = reference.replace(/–/g, '-').replace(/(\d+)[a-z]+/g, '$1');
  const match = normalized.match(/^(.+?)\s+(\d+)(?::\s*(\d+)(?:\s*-\s*(\d+))?)?$/);
  if (!match) return null;

  return {
    book: match[1].trim(),
    chapter: parseInt(match[2], 10),
    verseStart: match[3] ? parseInt(match[3], 10) : null,
    verseEnd: match[4] ? parseInt(match[4], 10) : null,
  };
}

function singleChapterBookVerseCount(book: string): number | null {
  return SINGLE_CHAPTER_BOOK_VERSES.get(book.trim().toLowerCase()) ?? null;
}

function isSingleChapterBookChapterOneReference(reference: string): boolean {
  const parsed = parseReference(reference.trim());
  if (!parsed || parsed.verseStart !== null) return false;
  if (parsed.chapter !== 1) return false;
  return singleChapterBookVerseCount(parsed.book) != null;
}

function scriptureReferenceForPassageQuery(reference: string): string {
  const trimmed = reference.trim();
  if (!isSingleChapterBookChapterOneReference(trimmed)) return trimmed;
  const parsed = parseReference(trimmed);
  if (!parsed) return trimmed;
  const lastVerse = singleChapterBookVerseCount(parsed.book);
  if (lastVerse == null) return trimmed;
  return `${parsed.book} 1:1-${lastVerse}`;
}

function canonicalScriptureCacheReference(reference: string): string {
  return reference.replace(/–/g, '-').replace(/(\d+)[a-z]+/g, '$1').trim();
}

function verseCountFromReference(reference: string): number {
  const parsed = parseReference(reference.trim());
  if (!parsed) return 1;

  if (parsed.verseStart != null && parsed.verseEnd != null) {
    return Math.max(1, parsed.verseEnd - parsed.verseStart + 1);
  }
  if (parsed.verseStart != null) return 1;

  const singleChapterVerses = singleChapterBookVerseCount(parsed.book);
  if (parsed.chapter === 1 && singleChapterVerses != null) {
    return singleChapterVerses;
  }

  return 1;
}

function verseCountInEsvText(text: string): number {
  const markers = text.match(/\[(\d+)\]/g);
  if (!markers?.length) return 1;
  return new Set(markers.map((marker) => parseInt(marker.slice(1, -1), 10))).size;
}

function cacheVerseCount(reference: string, passageText: string): number {
  return Math.max(verseCountFromReference(reference), verseCountInEsvText(passageText));
}

async function fetchFromEsv(reference: string): Promise<{
  reference: string;
  text: string;
  translation: 'esv';
}> {
  const apiToken = Deno.env.get('ESV_API_TOKEN');
  if (!apiToken) {
    throw new Error('ESV API token not configured');
  }

  const cleanReference = reference.trim();
  const queryReference = scriptureReferenceForPassageQuery(cleanReference);

  const response = await fetch(
    `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(queryReference)}&include-headings=false&include-footnotes=false&include-verse-numbers=true&include-short-copyright=false&include-passage-references=false`,
    {
      headers: {
        Authorization: `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`ESV API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.passages?.length > 0) {
    return {
      reference: cleanReference,
      text: String(data.passages[0]).trim(),
      translation: 'esv',
    };
  }
  throw new Error('Scripture text not found');
}

function errorStatus(message: string): number {
  if (/Scripture text not found/i.test(message)) return 404;
  if (/Invalid translation/i.test(message)) return 400;
  return 500;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get('reference')?.trim();
    const rawTranslation = (url.searchParams.get('translation') || 'esv').toLowerCase();

    if (!reference) {
      return new Response(JSON.stringify({ error: 'Scripture reference is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (rawTranslation !== 'esv') {
      return new Response(JSON.stringify({ error: 'Only ESV translation is supported' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const passageQueryReference = scriptureReferenceForPassageQuery(reference);
    const cacheReference = canonicalScriptureCacheReference(passageQueryReference);
    const cutoff = scriptureCacheCutoff(esvCacheTtlDays());

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: cached } = await supabase
      .from('scripture_cache')
      .select('text')
      .eq('reference', cacheReference)
      .eq('translation', 'esv')
      .gte('cached_at', cutoff.toISOString())
      .maybeSingle();

    if (cached?.text) {
      await touchScriptureCache(supabase, cacheReference);
      return new Response(
        JSON.stringify({
          reference,
          text: cached.text,
          translation: 'esv',
          cached: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await fetchFromEsv(passageQueryReference);
    const verseCount = cacheVerseCount(cacheReference, result.text);

    await supabase.from('scripture_cache').upsert(
      {
        reference: cacheReference,
        translation: 'esv',
        text: result.text,
        verse_count: verseCount,
        cached_at: new Date().toISOString(),
      },
      { onConflict: 'reference,translation' }
    );

    await pruneScriptureCache(supabase, esvCacheMaxVerses(), cutoff);

    return new Response(
      JSON.stringify({
        reference,
        text: result.text,
        translation: 'esv',
        cached: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: errorStatus(message),
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
