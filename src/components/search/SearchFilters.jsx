import { useState } from 'react';

const CATEGORIES = [
  'All', 'Nature', 'Sports', 'Music', 'Gaming', 'News', 'Cinematic',
  'Drone', 'Animation', 'Travel', 'Food', 'Technology', 'Animals',
  'People', 'Abstract', 'Custom…'
];

const SOURCES = [
  { id: 'pixabay', label: 'Pixabay', color: 'green' },
  { id: 'pexels',  label: 'Pexels',  color: 'teal' },
  { id: 'archive', label: 'Archive.org', color: 'orange' },
];

export default function SearchFilters({ filters, onChange }) {
  const [customCat, setCustomCat] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const setCategory = (cat) => {
    if (cat === 'Custom…') { setShowCustom(true); return; }
    onChange({ ...filters, category: cat === 'All' ? '' : cat });
  };

  const applyCustom = () => {
    if (customCat.trim()) {
      onChange({ ...filters, category: customCat.trim() });
      setShowCustom(false);
    }
  };

  const toggleSource = (id) => {
    const src = filters.sources || ['pixabay', 'pexels', 'archive'];
    const next = src.includes(id) ? src.filter(s => s !== id) : [...src, id];
    onChange({ ...filters, sources: next.length ? next : src });
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
              ${(filters.category || 'All') === (cat === 'All' ? '' : cat) || (cat === 'Custom…' && !CATEGORIES.slice(0,-1).includes(filters.category) && filters.category)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
          >
            {cat}
          </button>
        ))}
        {filters.category && !CATEGORIES.slice(0,-1).includes(filters.category) && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300">
            📁 {filters.category}
          </span>
        )}
      </div>

      {/* Custom category input */}
      {showCustom && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={customCat}
            onChange={e => setCustomCat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyCustom()}
            placeholder="Enter custom category…"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={applyCustom}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Apply
          </button>
          <button onClick={() => setShowCustom(false)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
        </div>
      )}

      {/* Source toggles */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 font-medium">Sources:</span>
        {SOURCES.map(s => (
          <button key={s.id} onClick={() => toggleSource(s.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
              ${(filters.sources || ['pixabay','pexels','archive']).includes(s.id)
                ? `bg-${s.color}-100 text-${s.color}-700 border-${s.color}-400`
                : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 line-through'
              }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
