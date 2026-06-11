import { useState, useCallback, useRef, useEffect } from 'react';
import SearchBar     from '../components/search/SearchBar';
import SearchFilters from '../components/search/SearchFilters';
import VideoCard     from '../components/search/VideoCard';
import PreviewDrawer      from '../components/search/PreviewDrawer';
import SaveToProjectModal from '../components/search/SaveToProjectModal';
import { searchVideos } from '../api/videoSearch';
import useEditorStore   from '../store/editorStore';
import {
  FiLoader, FiAlertCircle, FiFilm, FiGrid, FiList,
  FiX, FiClock, FiChevronDown, FiAlertTriangle,
  FiRefreshCw, FiFolder,
} from 'react-icons/fi';

const SORT_OPTIONS = [
  { value: 'relevance',     label: 'Relevance' },
  { value: 'duration_desc', label: 'Duration ↓' },
  { value: 'duration_asc',  label: 'Duration ↑' },
  { value: 'source',        label: 'Source A–Z' },
];

export default function SearchPage({ onGoToEditor }) {
  /* ── state ──────────────────────────────────────────────── */
  const [results,       setResults]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [error,         setError]         = useState(null);
  const [sourceErrors,  setSourceErrors]  = useState([]);
  const [searched,      setSearched]      = useState(false);
  const [currentQuery,  setCurrentQuery]  = useState('');
  const [sortBy,        setSortBy]        = useState('relevance');
  const [page,          setPage]          = useState(1);
  const [hasMore,       setHasMore]       = useState(false);
  const [view,          setView]          = useState('grid');
  const [filters,       setFilters]       = useState({
    category: '',
    sources:  ['pixabay', 'pexels', 'archive'],
  });
  const [history,      setHistory]        = useState([]);
  const [previewVideo, setPreviewVideo]   = useState(null); // drawer
  const [saveToProjectOpen, setSaveToProjectOpen] = useState(false);

  const { addClip, clips } = useEditorStore();
  const addedUrls = new Set(clips.map(c => c.url).filter(Boolean));
  const bottomRef = useRef();

  /* ── core search ────────────────────────────────────────── */
  const runSearch = useCallback(async (query, pg = 1, sort = sortBy, append = false) => {
    if (!query?.trim()) return;
    pg === 1 ? setLoading(true) : setLoadingMore(true);
    setError(null);

    try {
      const res = await searchVideos({
        query,
        category: filters.category,
        sources:  filters.sources,
        page:     pg,
        perPage:  30,
        sortBy:   sort,
      });

      setResults(prev => append ? [...prev, ...res.results] : res.results);
      setSourceErrors(res.sourceErrors || []);
      setPage(pg);
      setHasMore(!!res.hasMore);

      if (pg === 1) {
        setSearched(true);
        setCurrentQuery(query);
        setHistory(h => [
          { query, timestamp: Date.now() },
          ...h.filter(x => x.query !== query).slice(0, 9),
        ]);
        // Scroll results into view
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    } catch (e) {
      setError(e.message || 'Search failed — check your API keys in .env');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, sortBy]);

  const handleSearch  = (q)   => runSearch(q, 1, sortBy, false);
  const handleLoadMore = ()   => runSearch(currentQuery, page + 1, sortBy, true);
  const handleSort    = (s)   => { setSortBy(s); if (searched) runSearch(currentQuery, 1, s, false); };
  const clearResults  = ()    => { setResults([]); setSearched(false); setCurrentQuery(''); setError(null); setSourceErrors([]); };

  /* ── add to timeline ────────────────────────────────────── */
  const handleAdd = (video) => {
    addClip(video);
  };

  const isAdded = (video) =>
    addedUrls.has(video.url) || addedUrls.has(video.downloadUrl);

  return (
    <div className="h-full bg-gray-950 text-white flex flex-col overflow-hidden">

      {/* ── Sticky search header ────────────────────────────── */}
      <div className="flex-shrink-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-6 py-4 space-y-3 z-20">
        <div className="max-w-5xl mx-auto space-y-3">
          <SearchBar onSearch={handleSearch} loading={loading} />
          <SearchFilters filters={filters} onChange={(f) => setFilters(f)} />
        </div>
      </div>

      {/* ── Scrollable area ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-5 space-y-5">

          {/* ── Results toolbar ─────────────────────────────── */}
          {!loading && results.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-white">{results.length}</span>
                <span className="text-sm text-gray-400">results</span>
                {currentQuery && (
                  <span className="text-sm text-gray-500 truncate">
                    for <span className="text-blue-400 font-medium">"{currentQuery}"</span>
                  </span>
                )}
                {filters.category && (
                  <span className="text-[10px] bg-blue-900/40 text-blue-300 border border-blue-800/40
                    px-2 py-0.5 rounded-full flex-shrink-0">
                    {filters.category}
                  </span>
                )}
                <button onClick={clearResults} title="Clear results"
                  className="text-gray-600 hover:text-gray-400 flex-shrink-0 transition-colors">
                  <FiX size={13} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={e => handleSort(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-xs rounded-lg
                    px-2.5 py-1.5 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <div className="flex border border-gray-700 rounded-lg overflow-hidden">
                  {[['grid', <FiGrid size={13}/>], ['list', <FiList size={13}/>]].map(([v, ic]) => (
                    <button key={v} onClick={() => setView(v)}
                      className={`px-2.5 py-1.5 text-xs transition-colors
                        ${view === v ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                      {ic}
                    </button>
                  ))}
                </div>

                {clips.length > 0 && (
                  <button
                    onClick={() => setSaveToProjectOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700
                      hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors">
                    <FiFolder size={12} />
                    Save to Project
                  </button>
                )}
                <button onClick={onGoToEditor}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600
                    hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors">
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

          {/* ── Source errors ────────────────────────────────── */}
          {sourceErrors.length > 0 && (
            <div className="flex items-start gap-2 px-3 py-2.5
              bg-yellow-900/20 border border-yellow-800/40 rounded-xl">
              <FiAlertTriangle size={13} className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-0.5">
                <p className="text-xs text-yellow-300 font-semibold">
                  Some sources returned errors:
                </p>
                {sourceErrors.map((e, i) => (
                  <p key={i} className="text-[11px] text-yellow-400/70">
                    <span className="font-medium">{e.source}:</span> {e.error}
                  </p>
                ))}
              </div>
              <button onClick={() => setSourceErrors([])}
                className="text-yellow-600 hover:text-yellow-400 flex-shrink-0">
                <FiX size={13} />
              </button>
            </div>
          )}

          {/* ── Full-page loading ────────────────────────────── */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <FiLoader size={32} className="text-blue-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-300">Searching…</p>
                <p className="text-xs text-gray-600 mt-1">
                  Querying {filters.sources.length} source{filters.sources.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                {filters.sources.map((s, i) => (
                  <span key={s}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-gray-700
                      text-gray-500 animate-pulse font-medium"
                    style={{ animationDelay: `${i * 180}ms` }}
                  >
                    {s === 'pixabay' ? '🟢 Pixabay' : s === 'pexels' ? '🔵 Pexels' : '🟠 Archive'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Search error ─────────────────────────────────── */}
          {error && !loading && (
            <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-800/40
              rounded-xl max-w-2xl">
              <FiAlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-300">Search failed</p>
                <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
                <p className="text-[11px] text-gray-600 mt-1.5">
                  Make sure <code className="text-gray-400">VITE_PIXABAY_API_KEY</code> and{' '}
                  <code className="text-gray-400">VITE_PEXELS_API_KEY</code> are set in{' '}
                  <code className="text-gray-400">.env</code>
                </p>
                <button onClick={() => runSearch(currentQuery)}
                  className="flex items-center gap-1 mt-2 text-xs text-red-400
                    hover:text-red-300 transition-colors">
                  <FiRefreshCw size={11} /> Retry
                </button>
              </div>
              <button onClick={() => setError(null)}
                className="text-red-600 hover:text-red-400 flex-shrink-0"><FiX size={13} /></button>
            </div>
          )}

          {/* ── No results ───────────────────────────────────── */}
          {!loading && searched && results.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <span className="text-5xl">🔍</span>
              <p className="text-base font-semibold text-gray-400">No results for "{currentQuery}"</p>
              <p className="text-sm text-gray-600 max-w-sm">
                Try different keywords, disable filters, or enable more sources.
              </p>
              <button onClick={clearResults}
                className="mt-1 px-4 py-2 border border-gray-700 hover:border-gray-500
                  text-gray-400 hover:text-white rounded-lg text-sm transition-colors">
                Clear &amp; Search Again
              </button>
            </div>
          )}

          {/* ── Empty (not yet searched) ─────────────────────── */}
          {!loading && !searched && (
            <EmptyState history={history} onSearch={handleSearch} />
          )}

          {/* ── Results ─────────────────────────────────────── */}
          <div ref={bottomRef} />
          {!loading && results.length > 0 && (
            <>
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
                    onAdd={() => handleAdd(video)}
                    onPreview={() => setPreviewVideo(video)}
                    added={isAdded(video)}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center pt-4 pb-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-800
                      hover:bg-gray-700 border border-gray-700 hover:border-gray-500
                      text-gray-300 hover:text-white rounded-xl text-sm font-medium
                      transition-colors disabled:opacity-50 disabled:cursor-wait"
                  >
                    {loadingMore
                      ? <><FiLoader size={14} className="animate-spin" /> Loading…</>
                      : <><FiChevronDown size={14} /> Load more results</>
                    }
                  </button>
                </div>
              )}

              {/* Bottom CTA row */}
              {clips.length > 0 && (
                <div className="flex items-center justify-center gap-3 pt-2 pb-4 flex-wrap">
                  <button
                    onClick={() => setSaveToProjectOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700
                      hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold
                      transition-colors shadow-lg shadow-emerald-900/40">
                    <FiFolder size={14} />
                    Save {clips.length} clip{clips.length !== 1 ? 's' : ''} to Project
                  </button>
                  <button onClick={onGoToEditor}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600
                      hover:bg-blue-500 text-white rounded-xl text-sm font-semibold
                      transition-colors shadow-lg shadow-blue-900/40">
                    <FiFilm size={14} />
                    Go to Editor
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Save-to-project modal ──────────────────────────────── */}
      <SaveToProjectModal
        isOpen={saveToProjectOpen}
        onClose={() => setSaveToProjectOpen(false)}
        clips={clips}
        onSaved={(project) => {
          setSaveToProjectOpen(false);
          // Optionally navigate to editor with this project loaded
        }}
      />

      {/* ── Preview drawer ───────────────────────────────────── */}
      <PreviewDrawer
        video={previewVideo}
        onClose={() => setPreviewVideo(null)}
        onAdd={(v) => { handleAdd(v); setPreviewVideo(null); }}
        added={previewVideo ? isAdded(previewVideo) : false}
      />
    </div>
  );
}

/* ── Empty / landing state ───────────────────────────────────── */
function EmptyState({ history, onSearch }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-14 text-center">
      <div className="text-6xl select-none">🎞️</div>
      <div>
        <h2 className="text-xl font-bold text-gray-200">Find Videos for Your Compilation</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto leading-relaxed">
          Search Pixabay, Pexels &amp; Internet Archive simultaneously.
          Use operators to pinpoint exactly what you need.
        </p>
      </div>

      {/* Operator reference */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-xl w-full">
        {[
          { op: 'AND',          eg: 'nature AND aerial' },
          { op: 'OR',           eg: 'sunset OR sunrise' },
          { op: 'NOT',          eg: 'ocean NOT storm' },
          { op: '"phrase"',     eg: '"slow motion"' },
          { op: 'duration:',    eg: 'duration:10-60' },
          { op: 'resolution:',  eg: 'resolution:1080p' },
        ].map(({ op, eg }) => (
          <button
            key={op}
            onClick={() => onSearch(eg)}
            className="flex flex-col items-start px-3 py-2.5 bg-gray-900 border
              border-gray-800 hover:border-gray-600 rounded-xl text-left
              transition-colors group"
          >
            <code className="text-xs font-bold text-blue-400 group-hover:text-blue-300">
              {op}
            </code>
            <span className="text-[10px] text-gray-600 mt-0.5 group-hover:text-gray-500">
              {eg}
            </span>
          </button>
        ))}
      </div>

      {/* Recent searches */}
      {history.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] text-gray-600 uppercase font-semibold tracking-wider
            flex items-center gap-1">
            <FiClock size={10} /> Recent
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center max-w-lg">
            {history.map(h => (
              <button key={h.query} onClick={() => onSearch(h.query)}
                className="px-3 py-1 text-xs bg-gray-900 hover:bg-gray-800 border
                  border-gray-700 hover:border-gray-500 rounded-full text-gray-400
                  hover:text-white transition-colors">
                {h.query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
