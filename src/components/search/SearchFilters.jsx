import { useState } from 'react';
import { FiTag, FiDatabase, FiCheck, FiX } from 'react-icons/fi';

const CATEGORIES = [
  { label: 'All',         value: '' },
  { label: '🌿 Nature',   value: 'Nature' },
  { label: '⚽ Sports',   value: 'Sports' },
  { label: '🎵 Music',    value: 'Music' },
  { label: '🎬 Cinematic',value: 'Cinematic' },
  { label: '🚁 Drone',    value: 'Drone' },
  { label: '✈️ Travel',   value: 'Travel' },
  { label: '🐾 Animals',  value: 'Animals' },
  { label: '🏙️ Urban',    value: 'Urban' },
  { label: '🌊 Ocean',    value: 'Ocean' },
  { label: '🌌 Space',    value: 'Space' },
  { label: '🎮 Gaming',   value: 'Gaming' },
  { label: '💡 Tech',     value: 'Technology' },
  { label: '👤 People',   value: 'People' },
  { label: '🎨 Abstract', value: 'Abstract' },
  { label: '✏️ Custom',   value: '__custom__' },
];

const SOURCES = [
  { id: 'pixabay', label: 'Pixabay',       dot: 'bg-green-400' },
  { id: 'pexels',  label: 'Pexels',        dot: 'bg-teal-400'  },
  { id: 'archive', label: 'Archive.org',   dot: 'bg-orange-400'},
];

export default function SearchFilters({ filters, onChange }) {
  const [customInput,  setCustomInput]  = useState('');
  const [showCustom,   setShowCustom]   = useState(false);

  const setCategory = (val) => {
    if (val === '__custom__') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    onChange({ ...filters, category: val });
  };

  const applyCustom = () => {
    const v = customInput.trim();
    if (!v) return;
    onChange({ ...filters, category: v });
    setShowCustom(false);
  };

  const clearCustom = () => {
    setCustomInput('');
    setShowCustom(false);
    onChange({ ...filters, category: '' });
  };

  const toggleSource = (id) => {
    const src  = filters.sources || ['pixabay', 'pexels', 'archive'];
    const next = src.includes(id)
      ? src.filter(s => s !== id)
      : [...src, id];
    // Keep at least one source active
    if (next.length === 0) return;
    onChange({ ...filters, sources: next });
  };

  const activeCategory = filters.category;
  const isCustomActive = activeCategory && !CATEGORIES.find(c => c.value === activeCategory && c.value !== '__custom__');

  return (
    <div className="flex flex-col gap-2.5">

      {/* ── Category row ────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold
          uppercase tracking-wider flex-shrink-0">
          <FiTag size={10} /> Type
        </span>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(cat => {
            const isActive =
              cat.value === '__custom__'
                ? isCustomActive
                : cat.value === activeCategory;

            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border
                  transition-all whitespace-nowrap
                  ${isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-900/50'
                    : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
                  }`}
              >
                {cat.label}
              </button>
            );
          })}

          {/* Active custom badge */}
          {isCustomActive && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px]
              font-medium bg-purple-700/50 text-purple-200 border border-purple-700/50">
              📁 {activeCategory}
              <button onClick={clearCustom} className="hover:text-white ml-0.5">
                <FiX size={10} />
              </button>
            </span>
          )}
        </div>

        {/* Custom input inline */}
        {showCustom && (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') applyCustom();
                if (e.key === 'Escape') { setShowCustom(false); }
              }}
              placeholder="e.g. Documentary"
              className="px-2.5 py-1 bg-gray-800 border border-gray-600 rounded-lg
                text-xs text-white placeholder-gray-600 focus:outline-none
                focus:border-purple-500 w-36 transition-colors"
            />
            <button onClick={applyCustom}
              className="p-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-colors">
              <FiCheck size={11} />
            </button>
            <button onClick={() => setShowCustom(false)}
              className="p-1.5 border border-gray-700 text-gray-500 hover:text-white rounded-lg transition-colors">
              <FiX size={11} />
            </button>
          </div>
        )}
      </div>

      {/* ── Source toggles ───────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold
          uppercase tracking-wider flex-shrink-0">
          <FiDatabase size={10} /> Sources
        </span>

        <div className="flex gap-1.5">
          {SOURCES.map(src => {
            const active = (filters.sources || []).includes(src.id);
            return (
              <button
                key={src.id}
                onClick={() => toggleSource(src.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]
                  font-medium border transition-all
                  ${active
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-gray-900 text-gray-600 border-gray-800 opacity-50 hover:opacity-80'
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? src.dot : 'bg-gray-600'}`} />
                {src.label}
                {active && <FiCheck size={9} className="text-green-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
