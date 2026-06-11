import { useState, useCallback } from 'react';
import SearchBar from '../components/search/SearchBar';
import SearchFilters from '../components/search/SearchFilters';
import VideoCard from '../components/search/VideoCard';
import { searchVideos } from '../api/videoSearch';
import useEditorStore from '../store/editorStore';
import { FiLoader, FiAlertCircle, FiFilm, FiList } from 'react-icons/fi';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'duration',  label: 'Duration ↓' },
  { value: 'source',    label: 'Source' },
];

export default function SearchPage({ onGoToEditor }) {
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy]     = useState('relevance');
  const [filters, setFilters]   = useState({
    category: '',
    sources: ['pixabay', 'pexels', 'archive'],
  });
  const [history, setHistory]   = useState([]);
  const [view, setView]         = useState('grid'); // grid | list

  const { addClip, clips }      = useEditorStore();

  const handleSearch = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const { results: found } = await searchVideos({
        query,
        category: filters.category,
        sources: filters.sources,
      });
      const sorted = sortResults(found, sortBy);
      setResults(sorted);
      setHistory(h => [{ query, timestamp: Date.now() }, ...h.filter(x => x.query !== query).slice(0, 9)]);
    } catch (e) {
      setError(e.message || 'Search failed. Check your API keys in .env');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy]);

  const sortResults = (list, by) => {
    if (by === 'duration') return [...list].sort((a, b) => (b.duration || 0) - (a.duration || 0));
    if (by === 'source')   return [...list].sort((a, b) => a.source.localeCompare(b.source));
    return list;
  };

  const handleAdd = (video) => {
    addClip(video);
  };

  const alreadyAdded = (videoId) => clips.some(c => c.url === videoId || c.id === videoId);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <div>
              <h1 className="text-lg font-bold leading-none">CompileStudio</h1>
              <p className="text-xs text-gray-500">Video Search & Compilation Editor</p>
            </div>
          </div>

          <button
            onClick={onGoToEditor}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            <FiFilm />
            Editor {clips.length > 0 && <span className="bg-blue-500 text-xs px-1.5 py-0.5 rounded-full">{clips.length}</span>}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex flex-col gap-5">
        {/* Search bar */}
        <SearchBar onSearch={handleSearch} loading={loading} />

        {/* Filters */}
        <SearchFilters filters={filters} onChange={setFilters} />

        {/* Results toolbar */}
        {results.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              <span className="text-white font-medium">{results.length}</span> videos found
              {filters.category && <span> in <span className="text-blue-400">{filters.category}</span></span>}
            </p>
            <div className="flex items-center gap-2">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setResults(sortResults(results, e.target.value)); }}
                className="bg-gray-800 border border-gray-700 text-sm rounded-lg px-2 py-1.5 text-gray-300 focus:outline-none"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {/* View toggle */}
              <div className="flex border border-gray-700 rounded-lg overflow-hidden">
                <button onClick={() => setView('grid')}
                  className={`px-3 py-1.5 text-sm transition-colors ${view === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  ⊞
                </button>
                <button onClick={() => setView('list')}
                  className={`px-3 py-1.5 text-sm transition-colors ${view === 'list' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  <FiList />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* States */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
            <FiLoader className="text-blue-400 text-4xl animate-spin" />
            <p className="text-gray-400 text-sm">Searching across all sources…</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-700 rounded-xl text-sm">
            <FiAlertCircle className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-300 font-medium">Search Error</p>
              <p className="text-red-400/80 mt-0.5">{error}</p>
              <p className="text-gray-500 mt-1 text-xs">
                Make sure VITE_PIXABAY_API_KEY and VITE_PEXELS_API_KEY are set in your .env file.
              </p>
            </div>
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20 text-gray-600">
            <span className="text-5xl">🔍</span>
            <p className="text-lg font-medium text-gray-500">No results found</p>
            <p className="text-sm">Try different keywords or broaden your operators</p>
          </div>
        )}

        {!loading && !searched && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="text-6xl">🎞️</div>
            <h2 className="text-xl font-semibold text-gray-300">Find Videos for Your Compilation</h2>
            <p className="text-gray-600 text-sm max-w-md">
              Search across Pixabay, Pexels, and Internet Archive. Use operators like <code className="text-blue-400">site:</code>, <code className="text-blue-400">AND</code>, <code className="text-blue-400">NOT</code>, or <code className="text-blue-400">"exact phrase"</code> for precision results.
            </p>
            {history.length > 0 && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <p className="text-xs text-gray-600 uppercase font-medium">Recent searches</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {history.map(h => (
                    <button key={h.query} onClick={() => handleSearch(h.query)}
                      className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-gray-400">
                      {h.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results grid / list */}
        {!loading && results.length > 0 && (
          <div className={view === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'flex flex-col gap-3'
          }>
            {results.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                view={view}
                onAdd={handleAdd}
                added={alreadyAdded(video.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
