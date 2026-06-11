import { useState, useRef, useEffect } from 'react';
import { OPERATOR_HINTS, parseOperators } from '../../api/videoSearch';
import { FiSearch, FiX, FiChevronDown, FiZap } from 'react-icons/fi';

const QUICK_OPS = [
  { label: 'AND',      insert: ' AND ',      tip: 'Both terms required' },
  { label: 'OR',       insert: ' OR ',       tip: 'Either term' },
  { label: 'NOT',      insert: ' NOT ',      tip: 'Exclude a term' },
  { label: '"…"',      insert: '""',         tip: 'Exact phrase', cursor: 1 },
  { label: 'site:',    insert: ' site:',     tip: 'Specific source' },
  { label: 'type:',    insert: ' type:',     tip: 'Filter by type' },
  { label: 'duration:',insert: ' duration:', tip: 'Filter by length' },
];

export default function SearchBar({ onSearch, loading }) {
  const [query,      setQuery]      = useState('');
  const [showHints,  setShowHints]  = useState(false);
  const [parsedOps,  setParsedOps]  = useState(null);
  const [focused,    setFocused]    = useState(false);
  const inputRef  = useRef();
  const wrapperRef = useRef();

  useEffect(() => {
    if (query.trim()) setParsedOps(parseOperators(query));
    else setParsedOps(null);
  }, [query]);

  // Close hints on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowHints(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setShowHints(false);
    setFocused(false);
    inputRef.current?.blur();
    onSearch(query.trim());
  };

  const insertOp = (op) => {
    const input = inputRef.current;
    if (!input) return;
    const pos   = input.selectionStart ?? query.length;
    const before = query.slice(0, pos);
    const after  = query.slice(pos);

    let newVal, newCursor;
    if (op.insert === '""') {
      newVal    = before + '""' + after;
      newCursor = pos + 1;
    } else {
      newVal    = before + op.insert + after;
      newCursor = pos + op.insert.length;
    }
    setQuery(newVal);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const clear = () => {
    setQuery('');
    setParsedOps(null);
    inputRef.current?.focus();
  };

  const activeOps = parsedOps
    ? Object.entries(parsedOps).filter(([, v]) => v && (!Array.isArray(v) || v.length > 0))
    : [];

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* ── Main search row ───────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className={`relative flex-1 transition-all ${focused ? 'ring-2 ring-blue-500/40 rounded-xl' : ''}`}>
          <FiSearch
            size={16}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors
              ${focused || query ? 'text-blue-400' : 'text-gray-500'}`}
          />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { setFocused(true); setShowHints(true); }}
            onBlur={() => setFocused(false)}
            onKeyDown={e => e.key === 'Escape' && setShowHints(false)}
            placeholder='Search… e.g. "slow motion" AND nature NOT rain'
            className="w-full pl-10 pr-20 py-3 bg-gray-800 border border-gray-700
              rounded-xl text-sm text-white placeholder-gray-500
              focus:outline-none focus:border-blue-500 transition-colors"
          />

          {/* Right side of input */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button type="button" onClick={clear}
                className="text-gray-500 hover:text-white p-1 rounded transition-colors">
                <FiX size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowHints(h => !h)}
              className="flex items-center gap-0.5 text-[10px] text-gray-500
                hover:text-blue-400 transition-colors px-1"
              title="Toggle operator hints"
            >
              <FiZap size={12} />
              <FiChevronDown size={10} className={`transition-transform ${showHints ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl
            text-sm font-semibold transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center gap-2 min-w-[90px] justify-center"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><FiSearch size={14} /> Search</>
          }
        </button>
      </form>

      {/* ── Active operator pills ─────────────────────────────── */}
      {activeOps.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {activeOps.map(([key, val]) => (
            <span
              key={key}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5
                bg-blue-900/40 text-blue-300 border border-blue-800/50 rounded-full"
            >
              <FiZap size={9} />
              {key}: {Array.isArray(val) ? val.join(', ') : String(val)}
            </span>
          ))}
        </div>
      )}

      {/* ── Operator hints dropdown ───────────────────────────── */}
      {showHints && (
        <div className="absolute left-0 right-0 top-full mt-2 z-40
          bg-gray-900 border border-gray-700 rounded-xl shadow-2xl
          shadow-black/60 overflow-hidden">

          {/* Quick insert buttons */}
          <div className="px-3 py-2.5 border-b border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider mb-2">
              Quick Insert
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_OPS.map(op => (
                <button
                  key={op.label}
                  type="button"
                  onClick={() => insertOp(op)}
                  title={op.tip}
                  className="flex items-center gap-1 px-2.5 py-1 bg-gray-800
                    hover:bg-blue-900/50 border border-gray-700 hover:border-blue-700
                    rounded-lg text-xs text-gray-300 hover:text-blue-300
                    transition-colors font-mono"
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Full operator reference */}
          <div className="px-3 py-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 max-h-48 overflow-y-auto">
            <p className="col-span-2 text-[10px] text-gray-500 uppercase font-semibold tracking-wider mb-1">
              Operator Reference
            </p>
            {(OPERATOR_HINTS || []).map(hint => (
              <div key={hint.op} className="flex items-start gap-2">
                <code className="text-[10px] text-blue-400 font-mono flex-shrink-0 mt-0.5 w-20 truncate">
                  {hint.op}
                </code>
                <span className="text-[10px] text-gray-500 leading-snug">{hint.desc}</span>
              </div>
            ))}
          </div>

          {/* Example queries */}
          <div className="px-3 py-2.5 bg-gray-950/50 border-t border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider mb-1.5">
              Try these
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                '"slow motion" AND water',
                'drone OR aerial NOT city',
                'nature site:pixabay',
                '"time lapse" NOT people',
              ].map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => { setQuery(ex); setShowHints(false); inputRef.current?.focus(); }}
                  className="text-[10px] px-2 py-1 bg-gray-800 hover:bg-gray-700
                    border border-gray-700 rounded-lg text-gray-400 hover:text-white
                    transition-colors font-mono"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
