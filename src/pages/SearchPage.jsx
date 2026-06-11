import { useState, useCallback, useRef } from 'react';
import SearchBar from '../components/search/SearchBar';
import SearchFilters from '../components/search/SearchFilters';
import VideoCard from '../components/search/VideoCard';
import { searchVideos } from '../api/videoSearch';
import useEditorStore from '../store/editorStore';
import {
  FiLoader, FiAlertCircle, FiFilm, FiGrid,
  FiList, FiX, FiClock, FiSearch,
} from 'react-icons/fi';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'duration',  label: 'Duration ↓' },
  { value: 'source',    label: 'Source A–Z' },
];

export default function SearchPage({ onGoToEditor }) {
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [searched,  setSearched]  = useState(false);
  const [query,     setQuery]     = useState('');
  const [sortBy,    setSortBy]    = useState('relevance');
  const [filters,   setFilters]   = useState({
    category: '',
    sources: ['pixabay', 'pexels', 'archive'],
  });
  const [history,   setHistory]   = useState([]);
  const [view,      setView]      = useState('grid');

  const { addClip, clips } = useEditorStore();
  const addedSet = new Set(clips.map(c => c.url));

  const sortResults = (list, by) => {
    if (by === 'duration') return [...list].sort((a, b) => (b.duration || 0) - (a.duration || 0));
    if (by === 'source')   return [...list].sort((a, b) => a.source.localeCompare(b.source));
    return list;
  };

  const handleSearch = useCallback(async (q) => {
    if (!q?.trim()) return;
    setQuery(q);
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const { results: found } = await searchVideos({
        query: q,
        category: filters.category,
        sources:  filters.sources,
      });
      setResults(sortResults(found, sortBy));
      setHistory(h => [
        { query: q, timestamp: Date.now() },
        ...h.filter(x => x.query !== q).slice(0, 9),
      ]);
    } catch (e) {
      setError(e.message || 'Search failed — check your API keys in .env');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy]);

  const handleSort = (by) => {
    setSortBy(by);
    setResults(r => sortResults(r, by));
  };

  const clearResults = () => {
    setResults([]);
    setSearched(false);
    setQuery('');
    setError(null);
  };

  return (
    <div className="h-full bg-gray-950 text-white flex flex-col overflow-hidden">

      {/* ── Sticky search header ─────────────────────────────── */}
      <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-6 py-4 space-y-3">
        <div className="max-w-5xl mx-auto space-y-3">
          <SearchBar onSearch={handleSearch} loading={loading} />
          <SearchFilters filters={filters} onChange={setFilters} />
        </div>
      </div>

      {/* ── Scrollable results area ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-5 space-y-4">

          {/* ── Results toolbar ───────────────────────────────── */}
          {results.length > 0 && !loading && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-semibold">{results.length}</span>
                <span className="text-sm text-gray-400">videos</span>
                {query && (
                  <span className="text-sm text-gray-500">
                    for <span className="text-blue-400 font-medium">"{query}"</span>
                  </span>
                )}
                {filters.category && (
                  <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-800/50
                    px-2 py-0.5 rounded-full">
                    {filters.category}
                  </span>
                )}
                <button onClick={clearResults}
                  className="text-gray-600 hover:text-gray-400 transition-colors"
                  title="Clear results">
                  <FiX size={13} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={e => handleSort(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-xs rounded-lg
                    px-2.5 py-1.5 text-gray-300 focus:outline-none focus:border-blue-500
                    transition-colors"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* View toggle */}
                <div className="flex border border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setView('grid')}
                    className={`px-2.5 py-1.5 text-xs transition-colors
                      ${view === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    title="Grid view"
                  >
                    <FiGrid size={13} />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`px-2.5 py-1.5 text-xs transition-colors
                      ${view === 'list' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    title="List view"
                  >
                    <FiList size={13} />
                  </button>
                </div>

                {/* Go to editor */}
                <button
                  onClick={onGoToEditor}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600
                    hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <FiFilm size={12} />
                  Editor
                  {clips.length > 0 && (
                    <span className="bg-blue-500 text-[10px] w-4 h-4 rounded-full
                      flex items-center justify-center font-bold">
                      {clips.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Loading ───────────────────────────────────────── */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="relative">
                <FiLoader size={36} className="text-blue-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-300">Searching across all sources…</p>
                <p className="text-xs text-gray-600 mt-1">
                  Querying Pixabay, Pexels &amp; Internet Archive
                </p>
              </div>
              {/* Source indicator pills */}
              <div className="flex gap-2">
                {filters.sources.map((s, i) => (
                  <span key={s}
                    className="text-[10px] px-2.5 py-1 rounded-full border animate-pulse font-medium"
                    style={{ animationDelay: `${i * 200}ms` }}
                    data-source={s}
                  >
                    {s === 'pixabay' ? '🟢 Pixabay' : s === 'pexels' ? '🔵 Pexels' : '🟠 Archive'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Error ─────────────────────────────────────────── */}
          {error && !loading && (
            <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-800/50
              rounded-xl max-w-2xl mx-auto">
              <FiAlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-300">Search failed</p>
                <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
                <p className="text-[11px] text-gray-600 mt-1.5">
                  Make sure <code className="text-gray-400">VITE_PIXABAY_API_KEY</code> and{' '}
                  <code className="text-gray-400">VITE_PEXELS_API_KEY</code> are set in your{' '}
                  <code className="text-gray-400">.env</code> file.
                </p>
              </div>
              <button onClick={() => setError(null)}
                className="text-red-600 hover:text-red-400 flex-shrink-0">
                <FiX size={14} />
              </button>
            </div>
          )}

          {/* ── No results ────────────────────────────────────── */}
          {!loading && searched && results.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <span className="text-5xl">🔍</span>
              <p className="text-base font-semibold text-gray-400">No results for "{query}"</p>
              <p className="text-sm text-gray-600 max-w-sm">
                Try different keywords, remove operators, or enable more sources in the filters.
              </p>
              <button
                onClick={clearResults}
                className="mt-2 px-4 py-2 border border-gray-700 hover:border-gray-500
                  text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
              >
                Clear &amp; Search Again
              </button>
            </div>
          )}

          {/* ── Empty state (not yet searched) ────────────────── */}
          {!loading && !searched && (
            <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
              <div className="text-6xl select-none">🎞️</div>
              <div>
                <h2 className="text-xl font-bold text-gray-200">Find Videos for Your Compilation</h2>
                <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto leading-relaxed">
                  Search Pixabay, Pexels &amp; Internet Archive simultaneously.
                  Use Boolean operators for precision:
                </p>
              </div>

              {/* Operator chips */}
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {[
                  { op: 'AND',         eg: 'nature AND aerial' },
                  { op: 'OR',          eg: 'sunset OR sunrise' },
                  { op: 'NOT',         eg: 'ocean NOT storm' },
                  { op: '"phrase"',    eg: '"slow motion"' },
                  { op: 'site:',       eg: 'site:archive.org' },
                  { op: 'type:',       eg: 'type:drone' },
                ].map(({ op, eg }) => (
                  <div key={op}
                    className="flex flex-col items-center px-3 py-2 bg-gray-900 border
                      border-gray-800 rounded-xl text-center min-w-[90px]">
                    <code className="text-xs font-bold text-blue-400">{op}</code>
                    <span className="text-[10px] text-gray-600 mt-0.5">{eg}</span>
                  </div>
                ))}
              </div>

              {/* Recent history */}
              {history.length > 0 && (
                <div className="flex flex-col items-center gap-2 mt-2">
                  <p className="text-[10px] text-gray-600 uppercase font-semibold tracking-wider
                    flex items-center gap-1">
                    <FiClock size={10} /> Recent searches
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {history.map(h => (
                      <button
                        key={h.query}
                        onClick={() => handleSearch(h.query)}
                        className="px-3 py-1 text-xs bg-gray-900 hover:bg-gray-800
                          border border-gray-700 hover:border-gray-500
                          rounded-full text-gray-400 hover:text-white transition-colors"
                      >
                        {h.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Results grid / list ───────────────────────────── */}
          {!loading && results.length > 0 && (
            <div className={
              view === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'flex flex-col gap-2'
            }>
              {results.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  view={view}
                  onAdd={() => addClip(video)}
                  added={addedSet.has(video.url) || addedSet.has(video.downloadUrl)}
                />
              ))}
            </div>
          )}

          {/* ── Bottom editor CTA (when results showing) ──────── */}
          {!loading && results.length > 0 && clips.length > 0 && (
            <div className="flex items-center justify-center pt-4 pb-2">
              <button
                onClick={onGoToEditor}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600
                  hover:bg-blue-500 text-white rounded-xl text-sm font-semibold
                  transition-colors shadow-lg shadow-blue-900/40"
              >
                <FiFilm size={15} />
                Go to Editor — {clips.length} clip{clips.length !== 1 ? 's' : ''} ready
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
