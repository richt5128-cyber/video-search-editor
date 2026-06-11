import { useState, useEffect } from 'react';
import useEditorStore from '../../store/editorStore';
import { FiType, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';

const POSITIONS = [
  { id: 'top-left',    row: 0, col: 0, label: '↖' },
  { id: 'top-center',  row: 0, col: 1, label: '↑' },
  { id: 'top-right',   row: 0, col: 2, label: '↗' },
  { id: 'mid-left',    row: 1, col: 0, label: '←' },
  { id: 'center',      row: 1, col: 1, label: '⊙' },
  { id: 'mid-right',   row: 1, col: 2, label: '→' },
  { id: 'bot-left',    row: 2, col: 0, label: '↙' },
  { id: 'bot-center',  row: 2, col: 1, label: '↓' },
  { id: 'bot-right',   row: 2, col: 2, label: '↘' },
];

const FONTS = [
  { value: 'sans-serif', label: 'Sans' },
  { value: 'serif',      label: 'Serif' },
  { value: 'monospace',  label: 'Mono' },
  { value: 'cursive',    label: 'Script' },
  { value: 'Impact, sans-serif', label: 'Impact' },
];

const BLANK = (duration) => ({
  text: '', font: 'sans-serif', color: '#ffffff', bg: 'rgba(0,0,0,0.5)',
  size: 24, position: 'bot-center', start: 0, end: duration,
  bold: false, italic: false, shadow: true,
});

export default function TextOverlay({ clip }) {
  const { addTextOverlay, updateTextOverlay, removeTextOverlay } = useEditorStore();
  const duration = (clip.end_trim || 0) - (clip.start_trim || 0);
  const [draft, setDraft]     = useState(BLANK(duration));
  const [editing, setEditing] = useState(null); // overlay id being edited
  const [show, setShow]       = useState(false);

  useEffect(() => {
    setDraft(BLANK(duration));
    setShow(false);
    setEditing(null);
  }, [clip.id]);

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const handleAdd = () => {
    if (!draft.text.trim()) return;
    addTextOverlay(clip.id, { ...draft });
    setDraft(BLANK(duration));
    setShow(false);
  };

  const startEdit = (o) => {
    setEditing(o.id);
    setDraft({ ...o });
    setShow(true);
  };

  const handleUpdate = () => {
    if (!draft.text.trim()) return;
    updateTextOverlay(clip.id, editing, { ...draft });
    setEditing(null);
    setDraft(BLANK(duration));
    setShow(false);
  };

  const cancel = () => {
    setEditing(null);
    setDraft(BLANK(duration));
    setShow(false);
  };

  const overlays = clip.text_overlays || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FiType size={14} className="text-purple-400" /> Text Overlays
        </h3>
        {!show && (
          <button
            onClick={() => { setShow(true); setEditing(null); setDraft(BLANK(duration)); }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-700 hover:bg-purple-600
              text-white rounded-lg text-xs font-medium transition-colors"
          >
            <FiPlus size={12} /> Add
          </button>
        )}
      </div>

      {/* Existing overlays */}
      {overlays.length > 0 && (
        <div className="space-y-1.5">
          {overlays.map(o => (
            <div
              key={o.id}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors
                ${editing === o.id
                  ? 'bg-purple-900/20 border-purple-700/50'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
            >
              {/* Preview */}
              <div
                className="flex-1 min-w-0 truncate text-xs px-1.5 py-0.5 rounded"
                style={{
                  fontFamily: o.font, color: o.color,
                  fontWeight: o.bold ? 'bold' : 'normal',
                  fontStyle:  o.italic ? 'italic' : 'normal',
                  fontSize:   '12px',
                  background: o.bg || 'transparent',
                }}
              >
                {o.text}
              </div>

              {/* Meta */}
              <span className="text-[10px] text-gray-600 flex-shrink-0">{o.position}</span>
              <span className="text-[10px] text-gray-600 flex-shrink-0 font-mono">
                {o.start?.toFixed(1)}–{o.end?.toFixed(1)}s
              </span>

              {/* Actions */}
              <div className="flex gap-0.5 flex-shrink-0">
                <button onClick={() => startEdit(o)}
                  className="p-1 text-gray-500 hover:text-purple-400 rounded transition-colors">
                  <FiEdit2 size={11} />
                </button>
                <button onClick={() => removeTextOverlay(clip.id, o.id)}
                  className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors">
                  <FiTrash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {overlays.length === 0 && !show && (
        <div className="py-6 text-center text-gray-600 text-xs border border-dashed border-gray-800 rounded-lg">
          No overlays yet. Click <strong className="text-gray-500">Add</strong> to create one.
        </div>
      )}

      {/* Form */}
      {show && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-300">
            {editing ? 'Edit Overlay' : 'New Overlay'}
          </p>

          {/* Text input */}
          <input
            type="text" value={draft.text}
            onChange={e => set('text', e.target.value)}
            placeholder="Enter overlay text…"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
              text-sm text-white focus:outline-none focus:border-purple-500
              focus:ring-1 focus:ring-purple-500/30 transition-colors"
          />

          {/* Live preview */}
          {draft.text && (
            <div className="relative bg-gray-800 rounded-lg overflow-hidden h-12 flex items-center justify-center">
              <span
                className="px-2 py-0.5 rounded text-center"
                style={{
                  fontFamily: draft.font, color: draft.color,
                  fontSize: Math.min(draft.size, 20) + 'px',
                  fontWeight: draft.bold   ? 'bold'   : 'normal',
                  fontStyle:  draft.italic ? 'italic' : 'normal',
                  background: draft.bg,
                  textShadow: draft.shadow ? '0 1px 4px rgba(0,0,0,0.8)' : 'none',
                }}
              >
                {draft.text}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {/* Font */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wide">Font</label>
              <select
                value={draft.font} onChange={e => set('font', e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg
                  text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {FONTS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Size */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wide">Size</label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={10} max={120} value={draft.size}
                  onChange={e => set('size', +e.target.value)}
                  className="flex-1 accent-purple-500"
                />
                <span className="text-xs text-gray-400 w-8 text-right">{draft.size}</span>
              </div>
            </div>

            {/* Text color */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wide">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={draft.color} onChange={e => set('color', e.target.value)}
                  className="w-8 h-8 rounded border border-gray-700 bg-gray-800 cursor-pointer" />
                <span className="text-xs text-gray-500 font-mono">{draft.color}</span>
              </div>
            </div>

            {/* Style toggles */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wide">Style</label>
              <div className="flex gap-1.5">
                <ToggleBtn active={draft.bold}   onClick={() => set('bold',   !draft.bold)}   label="B" bold />
                <ToggleBtn active={draft.italic} onClick={() => set('italic', !draft.italic)} label="I" italic />
                <ToggleBtn active={draft.shadow} onClick={() => set('shadow', !draft.shadow)} label="S" />
              </div>
            </div>
          </div>

          {/* Position grid */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 uppercase tracking-wide">Position</label>
            <div className="grid grid-cols-3 gap-1 w-28">
              {POSITIONS.map(p => (
                <button key={p.id} onClick={() => set('position', p.id)}
                  className={`h-7 rounded text-sm transition-colors
                    ${draft.position === p.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-white border border-gray-700'
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wide">Start (s)</label>
              <input
                type="number" min={0} max={duration} step={0.1} value={draft.start?.toFixed(1)}
                onChange={e => set('start', +e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg
                  text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wide">End (s)</label>
              <input
                type="number" min={0} max={duration} step={0.1} value={draft.end?.toFixed(1)}
                onChange={e => set('end', +e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg
                  text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={editing ? handleUpdate : handleAdd}
              disabled={!draft.text.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-600
                hover:bg-purple-500 text-white rounded-lg text-xs font-semibold
                transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiCheck size={13} /> {editing ? 'Update' : 'Add Overlay'}
            </button>
            <button
              onClick={cancel}
              className="px-3 py-2 border border-gray-700 hover:border-gray-500
                text-gray-400 hover:text-white rounded-lg text-xs transition-colors"
            >
              <FiX size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleBtn({ active, onClick, label, bold, italic }) {
  return (
    <button onClick={onClick}
      className={`w-8 h-8 rounded text-xs border transition-colors
        ${active
          ? 'bg-purple-600 border-purple-500 text-white'
          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
        }`}
      style={{ fontWeight: bold ? 'bold' : 'normal', fontStyle: italic ? 'italic' : 'normal' }}
    >
      {label}
    </button>
  );
}
