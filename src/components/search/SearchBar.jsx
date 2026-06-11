import { useState, useRef, useEffect } from 'react';
import { OPERATOR_HINTS, parseOperators } from '../../api/videoSearch';
import { FiSearch, FiX, FiInfo } from 'react-icons/fi';

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [parsedOps, setParsedOps] = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    if (query.trim()) setParsedOps(parseOperators(query));
    else setParsedOps(null);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowHints(false);
    onSearch(query);
  };

  const insertOperator = (op) => {
    const val = op === '"phrase"' ? `"${query} "` : `${query} ${op} `;
    setQuery(val);
    inputRef.current?.focus();
    setShowHints(false);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setShowHints(true)}
            placeholder='Search videos... try: "slow motion" AND nature NOT rain'
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <FiX />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowHints(!showHints)}
          className="px-3 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-500 hover:text-blue-500 shadow-sm"
          title="Search operator help"
        >
          <FiInfo />
        </button>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                     text-white rounded-xl font-medium shadow-sm transition-colors"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Operator parsed preview */}
      {parsedOps && (parsedOps.mustExclude.length > 0 || parsedOps.exactPhrases.length > 0 || parsedOps.orGroups.length > 0) && (
        <div className="mt-1 flex flex-wrap gap-1 text-xs">
          {parsedOps.exactPhrases.map(p => (
            <span key={p} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">exact: "{p}"</span>
          ))}
          {parsedOps.mustExclude.map(p => (
            <span key={p} className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">NOT: {p}</span>
          ))}
          {parsedOps.orGroups.map((p, i) => (
            <span key={i} className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">OR: {p}</span>
          ))}
        </div>
      )}

      {/* Operator hints dropdown */}
      {showHints && (
        <div className="absolute z-50 top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl
                        border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Search Operators</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OPERATOR_HINTS.map(h => (
              <button
                key={h.op}
                type="button"
                onClick={() => insertOperator(h.op)}
                className="text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <code className="text-blue-600 dark:text-blue-400 text-xs font-mono">{h.example}</code>
                <p className="text-xs text-gray-500 mt-0.5">{h.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
