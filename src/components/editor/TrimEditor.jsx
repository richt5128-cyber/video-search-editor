import { useState, useEffect, useRef } from 'react';
import useEditorStore from '../../store/editorStore';
import { FiScissors, FiRotateCcw } from 'react-icons/fi';

const fmt = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${String(Math.round((s % 1) * 10)).padStart(1, '0')}`;

export default function TrimEditor({ clip }) {
  const { setTrim } = useEditorStore();
  const duration = clip.duration || 0;
  const [start, setStart] = useState(clip.start_trim || 0);
  const [end,   setEnd]   = useState(clip.end_trim   || duration);
  const barRef = useRef(null);

  // Sync when clip changes
  useEffect(() => {
    setStart(clip.start_trim || 0);
    setEnd(clip.end_trim || duration);
  }, [clip.id, clip.start_trim, clip.end_trim, duration]);

  const pct = (v) => duration > 0 ? `${(v / duration) * 100}%` : '0%';
  const trimmed = end - start;

  const apply = () => setTrim(clip.id, start, end);
  const reset  = () => { setStart(0); setEnd(duration); setTrim(clip.id, 0, duration); };

  // Scrub bar pointer drag
  const startDrag = (which) => (e) => {
    e.preventDefault();
    const bar = barRef.current;
    if (!bar) return;

    const move = (ev) => {
      const { left, width } = bar.getBoundingClientRect();
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
      const val   = parseFloat((ratio * duration).toFixed(1));
      if (which === 'start') setStart(Math.min(val, end - 0.1));
      else                   setEnd(Math.max(val, start + 0.1));
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup',   up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend',  up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup',   up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend',  up);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FiScissors size={14} className="text-blue-400" /> Trim Clip
        </h3>
        <span className="text-xs text-gray-400 font-mono">
          {fmt(trimmed)}
          <span className="text-gray-600"> / {fmt(duration)}</span>
        </span>
      </div>

      {/* Visual scrub bar */}
      <div className="space-y-1">
        <div ref={barRef} className="relative h-10 bg-gray-800 rounded-lg overflow-visible cursor-crosshair">
          {/* Inactive region (left) */}
          <div className="absolute inset-y-0 left-0 bg-gray-900/80 rounded-l-lg"
            style={{ width: pct(start) }} />

          {/* Active region */}
          <div className="absolute inset-y-0 bg-blue-600/30 border-y border-blue-500/40"
            style={{ left: pct(start), right: `${100 - (end / duration) * 100}%` }} />

          {/* Inactive region (right) */}
          <div className="absolute inset-y-0 right-0 bg-gray-900/80 rounded-r-lg"
            style={{ left: pct(end) }} />

          {/* Waveform decorative bars */}
          <div className="absolute inset-0 flex items-center gap-px px-1 pointer-events-none opacity-20">
            {Array.from({ length: 40 }, (_, i) => (
              <div key={i} className="flex-1 bg-blue-400 rounded-sm"
                style={{ height: `${20 + Math.sin(i * 0.8) * 15}%` }} />
            ))}
          </div>

          {/* In handle */}
          <div
            onMouseDown={startDrag('start')}
            onTouchStart={startDrag('start')}
            className="absolute top-0 bottom-0 w-3 bg-blue-500 hover:bg-blue-400
              cursor-ew-resize rounded-l-md transition-colors z-10 flex items-center justify-center"
            style={{ left: pct(start), transform: 'translateX(-1px)' }}
          >
            <div className="w-0.5 h-4 bg-white/60 rounded" />
          </div>

          {/* Out handle */}
          <div
            onMouseDown={startDrag('end')}
            onTouchStart={startDrag('end')}
            className="absolute top-0 bottom-0 w-3 bg-blue-500 hover:bg-blue-400
              cursor-ew-resize rounded-r-md transition-colors z-10 flex items-center justify-center"
            style={{ left: pct(end), transform: 'translateX(-2px)' }}
          >
            <div className="w-0.5 h-4 bg-white/60 rounded" />
          </div>
        </div>

        {/* Timecode labels */}
        <div className="flex justify-between text-[10px] text-gray-600 font-mono px-1">
          <span>0:00</span>
          <span>{fmt(duration / 2)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* Numeric inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block">
            In Point
          </label>
          <input
            type="number" min={0} max={end - 0.1} step={0.1}
            value={start.toFixed(1)}
            onChange={e => setStart(Math.max(0, Math.min(+e.target.value, end - 0.1)))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
              text-sm text-white font-mono focus:outline-none focus:border-blue-500
              focus:ring-1 focus:ring-blue-500/30 transition-colors"
          />
          <p className="text-[10px] text-blue-400 font-mono">{fmt(start)}</p>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block">
            Out Point
          </label>
          <input
            type="number" min={start + 0.1} max={duration} step={0.1}
            value={end.toFixed(1)}
            onChange={e => setEnd(Math.min(duration, Math.max(+e.target.value, start + 0.1)))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
              text-sm text-white font-mono focus:outline-none focus:border-blue-500
              focus:ring-1 focus:ring-blue-500/30 transition-colors"
          />
          <p className="text-[10px] text-blue-400 font-mono">{fmt(end)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={apply}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg
            text-sm font-semibold transition-colors shadow-sm shadow-blue-900/50"
        >
          Apply Trim
        </button>
        <button
          onClick={reset}
          title="Reset to full clip"
          className="px-3 py-2.5 border border-gray-700 hover:border-gray-500
            text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
        >
          <FiRotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
