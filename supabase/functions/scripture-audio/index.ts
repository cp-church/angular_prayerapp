const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

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

async function resolveEsvPassageAudioUrl(reference: string): Promise<string | null> {
  const apiToken = Deno.env.get('ESV_API_TOKEN');
  if (!apiToken) return null;
  const q = scriptureReferenceForPassageQuery(reference.trim());
  if (!q) return null;

  let url = `https://api.esv.org/v3/passage/audio/?q=${encodeURIComponent(q)}`;
  for (let hop = 0; hop < 8; hop += 1) {
    const response = await fetch(url, {
      headers: { Authorization: `Token ${apiToken}` },
      redirect: 'manual',
    });
    if (response.status >= 300 && response.status < 400) {
      const loc = response.headers.get('location');
      if (!loc) return null;
      url = new URL(loc, url).toString();
      continue;
    }
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('audio') || /\.mp3(\?|$)/i.test(url)) {
      return url;
    }
    return null;
  }
  return null;
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

    const audioUrl = await resolveEsvPassageAudioUrl(reference);
    if (!audioUrl) {
      if (!Deno.env.get('ESV_API_TOKEN')) {
        return new Response(JSON.stringify({ error: 'ESV audio is not configured.' }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({ error: 'Could not resolve ESV audio for this passage.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ audioUrl, useSpeechSynthesis: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to load audio.' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
