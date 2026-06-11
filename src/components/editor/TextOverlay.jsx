import { useState } from 'react';
import useEditorStore from '../../store/editorStore';

const POSITIONS = [
  { id: 'top-left',    label: '↖' }, { id: 'top-center',    label: '↑' }, { id: 'top-right',    label: '↗' },
  { id: 'mid-left',    label: '←' }, { id: 'center',         label: '⊙' }, { id: 'mid-right',    label: '→' },
  { id: 'bot-left',    label: '↙' }, { id: 'bot-center',    label: '↓' }, { id: 'bot-right',    label: '↘' },
];

const FONTS = ['Sans-serif', 'Serif', 'Monospace', 'Cursive', 'Impact'];

export default function TextOverlay({ clip }) {
  const { addTextOverlay, updateTextOverlay, removeTextOverlay } = useEditorStore();
  const [draft, setDraft] = useState({
    text: '', font: 'Sans-serif', color: '#ffffff', bg: '#00000080',
    size: 24, position: 'bot-center', start: 0, end: clip.end_trim - clip.start_trim,
    bold: false, italic: false,
  });

  const add = () => {
    if (!draft.text.trim()) return;
    addTextOverlay(clip.id, { ...draft });
    setDraft(d => ({ ...d, text: '' }));
  };

  return (
    <div className="p-4 bg-gray-900 rounded-xl space-y-3">
      <h3 className="text-sm font-semibold text-white">📝 Text Overlays</h3>

      {/* Existing overlays */}
      {clip.text_overlays?.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {clip.text_overlays.map(o => (
            <div key={o.id} className="flex items-center gap-2 bg-gray-800 px-2 py-1.5 rounded-lg">
              <span className="text-xs text-white flex-1 truncate" style={{ fontFamily: o.font, color: o.color }}>
                {o.text}
              </span>
              <span className="text-[10px] text-gray-500">{o.position}</span>
              <button onClick={() => removeTextOverlay(clip.id, o.id)}
                className="text-red-400 hover:text-red-300 text-xs ml-1">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Draft form */}
      <input type="text" value={draft.text} onChange={e => setDraft(d => ({ ...d, text: e.target.value }))}
        placeholder="Enter overlay text…"
        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Font</label>
          <select value={draft.font} onChange={e => setDraft(d => ({ ...d, font: e.target.value }))}
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-white">
            {FONTS.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Size</label>
          <input type="number" min={10} max={120} value={draft.size}
            onChange={e => setDraft(d => ({ ...d, size: +e.target.value }))}
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-white" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Text Color</label>
          <input type="color" value={draft.color} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}
            className="w-full h-8 rounded border border-gray-600 cursor-pointer bg-gray-800" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Style</label>
          <div className="flex gap-1">
            <button onClick={() => setDraft(d => ({ ...d, bold: !d.bold }))}
              className={`flex-1 py-1.5 rounded text-xs font-bold border ${draft.bold ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-400'}`}>B</button>
            <button onClick={() => setDraft(d => ({ ...d, italic: !d.italic }))}
              className={`flex-1 py-1.5 rounded text-xs italic border ${draft.italic ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-400'}`}>I</button>
          </div>
        </div>
      </div>

      {/* Position grid */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-1">Position</label>
        <div className="grid grid-cols-3 gap-1">
          {POSITIONS.map(p => (
            <button key={p.id} onClick={() => setDraft(d => ({ ...d, position: p.id }))}
              className={`py-1 rounded text-sm border transition-colors
                ${draft.position === p.id ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Show at (s)</label>
          <input type="number" min={0} step={0.1} value={draft.start}
            onChange={e => setDraft(d => ({ ...d, start: +e.target.value }))}
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-white" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Hide at (s)</label>
          <input type="number" min={0} step={0.1} value={draft.end}
            onChange={e => setDraft(d => ({ ...d, end: +e.target.value }))}
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-white" />
        </div>
      </div>

      <button onClick={add} disabled={!draft.text.trim()}
        className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black rounded-lg text-sm font-medium transition-colors">
        + Add Text Overlay
      </button>
    </div>
  );
}
