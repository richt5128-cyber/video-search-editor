import { useState } from 'react';
import useEditorStore from '../../store/editorStore';

const PRESETS = [
  { label: 'Lower Third',  color: '#000000', opacity: 0.6, type: 'lower-third' },
  { label: 'Vignette',     color: '#000000', opacity: 0.4, type: 'vignette' },
  { label: 'Color Tint',   color: '#1a40ff', opacity: 0.25, type: 'full' },
  { label: 'Warm Tint',    color: '#ff8800', opacity: 0.2, type: 'full' },
  { label: 'Cool Tint',    color: '#0044ff', opacity: 0.2, type: 'full' },
  { label: 'Watermark',    color: '#ffffff', opacity: 0.15, type: 'watermark' },
  { label: 'Cinematic Bars', color: '#000000', opacity: 1,   type: 'bars' },
];

export default function ScreenOverlay({ clip }) {
  const { addScreenOverlay, removeScreenOverlay } = useEditorStore();
  const [color, setColor]     = useState('#000000');
  const [opacity, setOpacity] = useState(0.3);
  const [type, setType]       = useState('full');
  const [label, setLabel]     = useState('Custom');

  const add = () => addScreenOverlay(clip.id, { color, opacity, type, label });

  const applyPreset = (p) => {
    setColor(p.color); setOpacity(p.opacity); setType(p.type); setLabel(p.label);
  };

  return (
    <div className="p-4 bg-gray-900 rounded-xl space-y-3">
      <h3 className="text-sm font-semibold text-white">🖼️ Screen Overlays</h3>

      {/* Active overlays */}
      {clip.screen_overlays?.length > 0 && (
        <div className="space-y-1">
          {clip.screen_overlays.map(o => (
            <div key={o.id} className="flex items-center gap-2 bg-gray-800 px-2 py-1.5 rounded">
              <div className="w-4 h-4 rounded" style={{ background: o.color, opacity: o.opacity + 0.4 }} />
              <span className="text-xs text-gray-300 flex-1">{o.label}</span>
              <span className="text-[10px] text-gray-500">{o.type} · {Math.round(o.opacity * 100)}%</span>
              <button onClick={() => removeScreenOverlay(clip.id, o.id)} className="text-red-400 text-xs">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Presets */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-1">Quick Presets</label>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-gray-300">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Color</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-full h-8 rounded border border-gray-600 cursor-pointer bg-gray-800" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Opacity {Math.round(opacity * 100)}%</label>
          <input type="range" min={0} max={1} step={0.05} value={opacity}
            onChange={e => setOpacity(+e.target.value)} className="w-full mt-2 accent-blue-500" />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-gray-500 block mb-1">Type</label>
        <div className="flex gap-1 flex-wrap">
          {['full', 'lower-third', 'vignette', 'watermark', 'bars'].map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-2 py-1 rounded text-[10px] border transition-colors
                ${type === t ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-700 text-gray-400'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <button onClick={add}
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">
        + Add Screen Overlay
      </button>
    </div>
  );
}
