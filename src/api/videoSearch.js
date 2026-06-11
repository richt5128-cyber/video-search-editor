/**
 * videoSearch.js
 * Multi-source video search aggregator with operator enhancement.
 *
 * Supports:
 *  - Pixabay (free stock video)
 *  - Pexels (free stock video)
 *  - Internet Archive (public domain / CC video)
 *  - Boolean operators: AND, OR, NOT, "exact phrase", site:, filetype:
 */

const PIXABAY_KEY = import.meta.env.VITE_PIXABAY_API_KEY || '';
const PEXELS_KEY  = import.meta.env.VITE_PEXELS_API_KEY  || '';

/* ─── Operator Parser ──────────────────────────────────────────────── */

export function parseOperators(raw) {
  const ops = {
    mustInclude:  [],
    mustExclude:  [],
    exactPhrases: [],
    siteFilter:   null,
    fileType:     null,
    orGroups:     [],
    cleanQuery:   raw,
  };

  let q = raw;

  // "exact phrase"
  const phrases = [...q.matchAll(/"([^"]+)"/g)];
  phrases.forEach(m => { ops.exactPhrases.push(m[1]); });
  q = q.replace(/"[^"]+"/g, '').trim();

  // site:xxx
  const siteMatch = q.match(/site:(\S+)/i);
  if (siteMatch) { ops.siteFilter = siteMatch[1]; q = q.replace(siteMatch[0], '').trim(); }

  // filetype:xxx
  const ftMatch = q.match(/filetype:(\S+)/i);
  if (ftMatch) { ops.fileType = ftMatch[1]; q = q.replace(ftMatch[0], '').trim(); }

  // NOT word
  const notMatches = [...q.matchAll(/\bNOT\s+(\S+)/gi)];
  notMatches.forEach(m => { ops.mustExclude.push(m[1]); });
  q = q.replace(/\bNOT\s+\S+/gi, '').trim();

  // OR groups
  if (/\bOR\b/i.test(q)) {
    ops.orGroups = q.split(/\bOR\b/i).map(s => s.trim()).filter(Boolean);
    q = ops.orGroups[0];
  }

  // AND (explicit) — just strip the keyword
  q = q.replace(/\bAND\b/gi, ' ').trim();

  ops.cleanQuery = [...ops.exactPhrases, q].join(' ').trim();
  return ops;
}

/* ─── Pixabay ──────────────────────────────────────────────────────── */

async function searchPixabay(query, { category = '', perPage = 20, page = 1 } = {}) {
  const params = new URLSearchParams({
    key: PIXABAY_KEY,
    q: query,
    video_type: 'all',
    per_page: perPage,
    page,
    safesearch: 'true',
  });
  if (category) params.set('category', category.toLowerCase());

  const res = await fetch(`https://pixabay.com/api/videos/?${params}`);
  if (!res.ok) throw new Error('Pixabay API error');
  const data = await res.json();

  return (data.hits || []).map(v => ({
    id: `pixabay-${v.id}`,
    source: 'Pixabay',
    title: v.tags,
    thumbnail: v.videos?.tiny?.thumbnail || v.userImageURL,
    duration: v.duration,
    downloadUrl: v.videos?.medium?.url || v.videos?.small?.url,
    pageUrl: v.pageURL,
    author: v.user,
    license: 'Pixabay License (free)',
    width: v.videos?.medium?.width,
    height: v.videos?.medium?.height,
  }));
}

/* ─── Pexels ───────────────────────────────────────────────────────── */

async function searchPexels(query, { perPage = 20, page = 1 } = {}) {
  if (!PEXELS_KEY) return [];
  const params = new URLSearchParams({ query, per_page: perPage, page });
  const res = await fetch(`https://api.pexels.com/videos/search?${params}`, {
    headers: { Authorization: PEXELS_KEY },
  });
  if (!res.ok) throw new Error('Pexels API error');
  const data = await res.json();

  return (data.videos || []).map(v => {
    const best = v.video_files?.find(f => f.quality === 'hd') || v.video_files?.[0];
    return {
      id: `pexels-${v.id}`,
      source: 'Pexels',
      title: v.url?.split('/').filter(Boolean).pop() || `Pexels ${v.id}`,
      thumbnail: v.image,
      duration: v.duration,
      downloadUrl: best?.link,
      pageUrl: v.url,
      author: v.user?.name,
      license: 'Pexels License (free)',
      width: best?.width,
      height: best?.height,
    };
  });
}

/* ─── Internet Archive ─────────────────────────────────────────────── */

async function searchArchive(query, { rows = 20, page = 1, mediatype = 'movies' } = {}) {
  const q = encodeURIComponent(`${query} AND mediatype:${mediatype}`);
  const url = `https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier,title,description,subject,avg_rating&sort[]=downloads+desc&rows=${rows}&page=${page}&output=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Archive.org API error');
  const data = await res.json();

  return (data.response?.docs || []).map(doc => ({
    id: `archive-${doc.identifier}`,
    source: 'Internet Archive',
    title: doc.title,
    thumbnail: `https://archive.org/services/img/${doc.identifier}`,
    duration: null,
    downloadUrl: `https://archive.org/download/${doc.identifier}`,
    pageUrl: `https://archive.org/details/${doc.identifier}`,
    author: null,
    license: 'Public Domain / CC',
    description: doc.description,
  }));
}

/* ─── Aggregated Search ────────────────────────────────────────────── */

export async function searchVideos({ query, category = '', sources = ['pixabay', 'pexels', 'archive'], page = 1 }) {
  const ops = parseOperators(query);
  const cleanQ = ops.cleanQuery;

  const jobs = [];
  if (sources.includes('pixabay') && PIXABAY_KEY) jobs.push(searchPixabay(cleanQ, { category, page }));
  if (sources.includes('pexels') && PEXELS_KEY)   jobs.push(searchPexels(cleanQ, { page }));
  if (sources.includes('archive'))                 jobs.push(searchArchive(cleanQ, { page }));

  const settled = await Promise.allSettled(jobs);
  let results = settled.flatMap(r => r.status === 'fulfilled' ? r.value : []);

  // Apply NOT exclusions
  if (ops.mustExclude.length) {
    const excl = ops.mustExclude.map(w => w.toLowerCase());
    results = results.filter(v => {
      const hay = `${v.title} ${v.description || ''}`.toLowerCase();
      return !excl.some(w => hay.includes(w));
    });
  }

  // Apply exact phrase filter
  if (ops.exactPhrases.length) {
    results = results.filter(v => {
      const hay = `${v.title} ${v.description || ''}`.toLowerCase();
      return ops.exactPhrases.every(p => hay.includes(p.toLowerCase()));
    });
  }

  return { results, operators: ops, total: results.length };
}

/* ─── Operator Suggestions ─────────────────────────────────────────── */

export const OPERATOR_HINTS = [
  { op: 'AND',        example: 'nature AND sunset',       desc: 'Both terms must appear' },
  { op: 'OR',         example: 'ocean OR sea',            desc: 'Either term matches' },
  { op: 'NOT',        example: 'music NOT rock',          desc: 'Exclude a term' },
  { op: '"phrase"',   example: '"slow motion"',           desc: 'Exact phrase match' },
  { op: 'site:',      example: 'site:archive.org',        desc: 'Search specific site' },
  { op: 'filetype:',  example: 'filetype:mp4',            desc: 'Filter by file type' },
];
