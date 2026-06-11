/**
 * videoSearch.js
 * Multi-source video search aggregator with operator enhancement.
 *
 * Sources  : Pixabay · Pexels · Internet Archive
 * Operators: AND · OR · NOT · "exact phrase" · site: · filetype:
 *            type: · duration: · resolution: · author: · category:
 *
 * Features : Pagination · per-source rate-limit protection (350 ms stagger
 *            + exponential back-off) · result deduplication · relevance scoring
 */

const PIXABAY_KEY = import.meta.env.VITE_PIXABAY_API_KEY || '';
const PEXELS_KEY  = import.meta.env.VITE_PEXELS_API_KEY  || '';

/* ── helpers ─────────────────────────────────────────────────── */

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function withBackoff(fn, retries = 2, baseMs = 600) {
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === retries) throw e;
      await delay(baseMs * (i + 1));
    }
  }
}

async function staggered(fns, gapMs = 350) {
  const results = [];
  for (let i = 0; i < fns.length; i++) {
    results.push(
      await withBackoff(fns[i]).catch(e => ({ __error: e.message, __source: fns[i]._src }))
    );
    if (i < fns.length - 1) await delay(gapMs);
  }
  return results;
}

function tag(fn, src) { fn._src = src; return fn; }

/* ── Operator Parser ─────────────────────────────────────────── */

export function parseOperators(raw) {
  const ops = {
    mustInclude:  [],
    mustExclude:  [],
    exactPhrases: [],
    siteFilter:   null,
    fileType:     null,
    typeFilter:   null,
    durationFilter: null,   // { min?, max? }  seconds
    resolutionFilter: null, // e.g. '1080p'
    authorFilter: null,
    categoryFilter: null,
    orGroups:     [],
    cleanQuery:   raw,
  };

  let q = raw;

  // "exact phrase"
  const phrases = [...q.matchAll(/"([^"]+)"/g)];
  phrases.forEach(m => ops.exactPhrases.push(m[1]));
  q = q.replace(/"[^"]+"/g, '').trim();

  // site:xxx
  const siteM = q.match(/\bsite:(\S+)/i);
  if (siteM) { ops.siteFilter = siteM[1]; q = q.replace(siteM[0], '').trim(); }

  // filetype:xxx
  const ftM = q.match(/\bfiletype:(\S+)/i);
  if (ftM) { ops.fileType = ftM[1]; q = q.replace(ftM[0], '').trim(); }

  // type:xxx  (e.g. type:drone, type:timelapse)
  const typeM = q.match(/\btype:(\S+)/i);
  if (typeM) { ops.typeFilter = typeM[1]; q = q.replace(typeM[0], '').trim(); }

  // duration:min-max  or  duration:>N  or  duration:<N  (seconds)
  const durRange = q.match(/\bduration:(\d+)-(\d+)/i);
  const durGt    = q.match(/\bduration:>(\d+)/i);
  const durLt    = q.match(/\bduration:<(\d+)/i);
  if (durRange) {
    ops.durationFilter = { min: +durRange[1], max: +durRange[2] };
    q = q.replace(durRange[0], '').trim();
  } else if (durGt) {
    ops.durationFilter = { min: +durGt[1] };
    q = q.replace(durGt[0], '').trim();
  } else if (durLt) {
    ops.durationFilter = { max: +durLt[1] };
    q = q.replace(durLt[0], '').trim();
  }

  // resolution:1080p / resolution:4k / resolution:720p
  const resM = q.match(/\bresolution:(\S+)/i);
  if (resM) { ops.resolutionFilter = resM[1].toLowerCase(); q = q.replace(resM[0], '').trim(); }

  // author:name
  const authM = q.match(/\bauthor:(\S+)/i);
  if (authM) { ops.authorFilter = authM[1].toLowerCase(); q = q.replace(authM[0], '').trim(); }

  // category:name
  const catM = q.match(/\bcategory:(\S+)/i);
  if (catM) { ops.categoryFilter = catM[1]; q = q.replace(catM[0], '').trim(); }

  // NOT word
  const notMs = [...q.matchAll(/\bNOT\s+(\S+)/gi)];
  notMs.forEach(m => ops.mustExclude.push(m[1]));
  q = q.replace(/\bNOT\s+\S+/gi, '').trim();

  // OR groups
  if (/\bOR\b/i.test(q)) {
    ops.orGroups = q.split(/\bOR\b/i).map(s => s.trim()).filter(Boolean);
    q = ops.orGroups[0];
  }

  // AND (strip keyword, keep terms)
  q = q.replace(/\bAND\b/gi, ' ').trim();

  ops.cleanQuery = [...ops.exactPhrases, q].filter(Boolean).join(' ').trim();
  return ops;
}

/* ── Relevance scorer ────────────────────────────────────────── */

function score(video, ops) {
  let s = 0;
  const hay = `${video.title || ''} ${video.description || ''} ${video.tags || ''}`.toLowerCase();
  ops.exactPhrases.forEach(p => { if (hay.includes(p.toLowerCase())) s += 10; });
  ops.mustInclude.forEach(w  => { if (hay.includes(w.toLowerCase()))  s += 3; });
  if (ops.cleanQuery) {
    ops.cleanQuery.split(/\s+/).forEach(w => {
      if (w.length > 2 && hay.includes(w.toLowerCase())) s += 1;
    });
  }
  if (video.duration) s += 1;          // prefer clips with known duration
  if (video.width >= 1920) s += 2;     // prefer HD
  return s;
}

/* ── Post-filter pipeline ────────────────────────────────────── */

function applyFilters(results, ops) {
  // NOT
  if (ops.mustExclude.length) {
    const ex = ops.mustExclude.map(w => w.toLowerCase());
    results = results.filter(v => {
      const h = `${v.title} ${v.description || ''} ${v.tags || ''}`.toLowerCase();
      return !ex.some(w => h.includes(w));
    });
  }

  // exact phrases
  if (ops.exactPhrases.length) {
    results = results.filter(v => {
      const h = `${v.title} ${v.description || ''}`.toLowerCase();
      return ops.exactPhrases.every(p => h.includes(p.toLowerCase()));
    });
  }

  // type filter (appended to query, best-effort)
  if (ops.typeFilter) {
    const tf = ops.typeFilter.toLowerCase();
    results = results.filter(v =>
      `${v.title} ${v.description || ''} ${v.tags || ''}`.toLowerCase().includes(tf)
    );
  }

  // author filter
  if (ops.authorFilter) {
    const af = ops.authorFilter.toLowerCase();
    results = results.filter(v => (v.author || '').toLowerCase().includes(af));
  }

  // duration filter
  if (ops.durationFilter) {
    const { min, max } = ops.durationFilter;
    results = results.filter(v => {
      if (!v.duration) return true; // keep unknowns
      if (min != null && v.duration < min) return false;
      if (max != null && v.duration > max) return false;
      return true;
    });
  }

  // resolution filter
  if (ops.resolutionFilter) {
    const minH = { '4k': 2160, '1080p': 1080, '720p': 720, '480p': 480 }[ops.resolutionFilter] || 0;
    results = results.filter(v => !v.height || v.height >= minH);
  }

  // site filter — keep only matching source
  if (ops.siteFilter) {
    const sf = ops.siteFilter.toLowerCase();
    results = results.filter(v => {
      if (sf.includes('pixabay')) return v.source === 'Pixabay';
      if (sf.includes('pexels'))  return v.source === 'Pexels';
      if (sf.includes('archive')) return v.source === 'Internet Archive';
      return true;
    });
  }

  return results;
}

/* ── Deduplication ───────────────────────────────────────────── */

function dedupe(results) {
  const seen = new Set();
  return results.filter(v => {
    const key = v.downloadUrl || v.pageUrl || v.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ── Pixabay ─────────────────────────────────────────────────── */

async function searchPixabay(query, { category = '', perPage = 30, page = 1 } = {}) {
  if (!PIXABAY_KEY) return [];
  const params = new URLSearchParams({
    key:        PIXABAY_KEY,
    q:          query,
    video_type: 'all',
    per_page:   perPage,
    page,
    safesearch: 'true',
    order:      'popular',
  });
  if (category) params.set('category', category.toLowerCase());

  const res = await fetch(`https://pixabay.com/api/videos/?${params}`);
  if (res.status === 429) throw new Error('Pixabay rate limit — retrying…');
  if (!res.ok) throw new Error(`Pixabay ${res.status}`);
  const data = await res.json();

  return (data.hits || []).map(v => ({
    id:          `pixabay-${v.id}`,
    source:      'Pixabay',
    title:       v.tags || `Pixabay ${v.id}`,
    tags:        v.tags,
    thumbnail:   v.videos?.tiny?.thumbnail || v.userImageURL || '',
    duration:    v.duration,
    downloadUrl: v.videos?.medium?.url || v.videos?.large?.url || v.videos?.small?.url || '',
    pageUrl:     v.pageURL,
    author:      v.user,
    license:     'Pixabay License (free)',
    width:       v.videos?.medium?.width  || v.videos?.large?.width,
    height:      v.videos?.medium?.height || v.videos?.large?.height,
    views:       v.views,
    downloads:   v.downloads,
  }));
}

/* ── Pexels ──────────────────────────────────────────────────── */

async function searchPexels(query, { perPage = 30, page = 1 } = {}) {
  if (!PEXELS_KEY) return [];
  const params = new URLSearchParams({ query, per_page: perPage, page });
  const res = await fetch(`https://api.pexels.com/videos/search?${params}`, {
    headers: { Authorization: PEXELS_KEY },
  });
  if (res.status === 429) throw new Error('Pexels rate limit — retrying…');
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const data = await res.json();

  return (data.videos || []).map(v => {
    const hd   = v.video_files?.find(f => f.quality === 'hd')  || null;
    const sd   = v.video_files?.find(f => f.quality === 'sd')  || null;
    const best = hd || sd || v.video_files?.[0];
    return {
      id:          `pexels-${v.id}`,
      source:      'Pexels',
      title:       v.url?.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || `Pexels ${v.id}`,
      tags:        '',
      thumbnail:   v.image || '',
      duration:    v.duration,
      downloadUrl: best?.link || '',
      pageUrl:     v.url,
      author:      v.user?.name,
      license:     'Pexels License (free)',
      width:       best?.width,
      height:      best?.height,
    };
  });
}

/* ── Internet Archive ────────────────────────────────────────── */

async function searchArchive(query, { rows = 30, page = 1 } = {}) {
  const q   = encodeURIComponent(`${query} AND mediatype:movies`);
  const url = `https://archive.org/advancedsearch.php` +
              `?q=${q}&fl[]=identifier,title,description,subject,downloads` +
              `&sort[]=downloads+desc&rows=${rows}&page=${page}&output=json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Archive.org ${res.status}`);
  const data = await res.json();

  return (data.response?.docs || []).map(doc => ({
    id:          `archive-${doc.identifier}`,
    source:      'Internet Archive',
    title:       doc.title || doc.identifier,
    tags:        Array.isArray(doc.subject) ? doc.subject.join(', ') : (doc.subject || ''),
    thumbnail:   `https://archive.org/services/img/${doc.identifier}`,
    duration:    null,
    downloadUrl: `https://archive.org/download/${doc.identifier}`,
    pageUrl:     `https://archive.org/details/${doc.identifier}`,
    author:      null,
    license:     'Public Domain / CC',
    description: typeof doc.description === 'string' ? doc.description : '',
    downloads:   doc.downloads,
  }));
}

/* ── Main aggregated search ──────────────────────────────────── */

export async function searchVideos({
  query,
  category      = '',
  sources       = ['pixabay', 'pexels', 'archive'],
  page          = 1,
  perPage       = 30,
  sortBy        = 'relevance',
}) {
  if (!query?.trim()) return { results: [], operators: {}, total: 0, sourceErrors: [], page };

  const ops    = parseOperators(query);
  const cleanQ = ops.cleanQuery || query;

  // Category from operator or filter panel
  const effectiveCat = ops.categoryFilter || category;

  const fns = [];
  if (sources.includes('pixabay') && PIXABAY_KEY)
    fns.push(tag(() => searchPixabay(cleanQ, { category: effectiveCat, perPage, page }), 'Pixabay'));
  if (sources.includes('pexels') && PEXELS_KEY)
    fns.push(tag(() => searchPexels(cleanQ, { perPage, page }), 'Pexels'));
  if (sources.includes('archive'))
    fns.push(tag(() => searchArchive(cleanQ, { rows: perPage, page }), 'Archive'));

  const settled     = await staggered(fns, 350);
  const sourceErrors = settled
    .filter(r => r?.__error)
    .map(r => ({ source: r.__source, error: r.__error }));
  let results = settled.flatMap(r => (r?.__error ? [] : Array.isArray(r) ? r : []));

  // Post-filters
  results = applyFilters(results, ops);

  // Deduplication
  results = dedupe(results);

  // Scoring + sort
  results = results.map(v => ({ ...v, _score: score(v, ops) }));

  switch (sortBy) {
    case 'duration_desc': results.sort((a, b) => (b.duration || 0) - (a.duration || 0)); break;
    case 'duration_asc':  results.sort((a, b) => (a.duration || 0) - (b.duration || 0)); break;
    case 'source':        results.sort((a, b) => a.source.localeCompare(b.source)); break;
    case 'relevance':
    default:              results.sort((a, b) => b._score - a._score);
  }

  return {
    results,
    operators:    ops,
    total:        results.length,
    sourceErrors,
    page,
    hasMore:      results.length >= perPage,
  };
}

/* ── Operator hints (for UI) ─────────────────────────────────── */

export const OPERATOR_HINTS = [
  { op: 'AND',            example: 'nature AND sunset',        desc: 'Both terms required' },
  { op: 'OR',             example: 'ocean OR sea',             desc: 'Either term matches' },
  { op: 'NOT',            example: 'music NOT rock',           desc: 'Exclude a term' },
  { op: '"phrase"',       example: '"slow motion"',            desc: 'Exact phrase match' },
  { op: 'site:',          example: 'site:archive.org',         desc: 'Limit to one source' },
  { op: 'type:',          example: 'type:drone',               desc: 'Filter by video type' },
  { op: 'duration:N-M',   example: 'duration:10-60',           desc: 'Length range (seconds)' },
  { op: 'duration:>N',    example: 'duration:>30',             desc: 'Longer than N seconds' },
  { op: 'duration:<N',    example: 'duration:<15',             desc: 'Shorter than N seconds' },
  { op: 'resolution:',    example: 'resolution:1080p',         desc: 'Min resolution (720p/1080p/4k)' },
  { op: 'author:',        example: 'author:NatureClips',       desc: 'Filter by creator name' },
  { op: 'category:',      example: 'category:travel',          desc: 'Override category filter' },
  { op: 'filetype:',      example: 'filetype:mp4',             desc: 'Filter by file extension' },
];
