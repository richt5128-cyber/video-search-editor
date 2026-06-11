import { useState, useRef } from 'react';
import useEditorStore from '../../store/editorStore';

export default function TrimEditor({ clip }) {
  const { setTrim } = useEditorStore();
  const [start, setStart] = useState(clip.start_trim || 0);
  const [end, setEnd]     = useState(clip.end_trim   || clip.duration || 0);
  const duration = clip.duration || 0;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${String(Math.round((s % 1) * 10)).padStart(1,'0')}`;

  const apply = () => setTrim(clip.id, start, end);

  return (
    <div className="p-4 bg-gray-900 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">✂️ Trim Clip</h3>
        <span className="text-xs text-gray-400">{fmt(end - start)} selected of {fmt(duration)}</span>
      </div>

      {/* Visual scrub bar */}
      <div className="relative h-8 bg-gray-700 rounded-lg overflow-hidden">
        {/* Active region */}
        <div
          className="absolute top-0 bottom-0 bg-blue-600/60 border-x-2 border-blue-400"
          style={{ left: `${(start / duration) * 100}%`, right: `${((duration - end) / duration) * 100}%` }}
        />
        {/* In handle */}
        <input type="range" min={0} max={duration} step={0.1} value={start}
          onChange={e => { const v = Math.min(+e.target.value, end - 0.1); setStart(v); }}
          className="absolute inset-0 w-full opacity-0 cursor-ew-resize"
          style={{ zIndex: 2 }}
        />
      </div>

      {/* Numeric inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">In Point (s)</label>
          <input type="number" min={0} max={end - 0.1} step={0.1} value={start.toFixed(1)}
            onChange={e => setStart(Math.max(0, Math.min(+e.target.value, end - 0.1)))}
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-600 mt-0.5">{fmt(start)}</p>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Out Point (s)</label>
          <input type="number" min={start + 0.1} max={duration} step={0.1} value={end.toFixed(1)}
            onChange={e => setEnd(Math.min(duration, Math.max(+e.target.value, start + 0.1)))}
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-600 mt-0.5">{fmt(end)}</p>
        </div>
      </div>

      <button onClick={apply}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
        Apply Trim
      </button>
    </div>
  );
}
