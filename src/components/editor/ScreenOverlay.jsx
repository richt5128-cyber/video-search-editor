import { useState, useEffect } from 'react';
import useEditorStore from '../../store/editorStore';
import { FiLayers, FiPlus, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';

const OVERLAY_TYPES = [
  { id: 'color',    label: 'Color Fill',    icon: '🎨', desc: 'Solid or semi-transparent color' },
  { id: 'gradient', label: 'Gradient',      icon: '🌅', desc: 'Top/bottom gradient sweep' },
  { id: 'vignette', label: 'Vignette',      icon: '⭕', desc: 'Darken edges' },
  { id: 'bars',     label: 'Letterbox',     icon: '▬',  desc: 'Cinematic black bars' },
  { id: 'blur',     label: 'Blur Region',   icon: '💫', desc: 'Blur a portion of the frame' },
];

const BLEND_MODES = ['normal','multiply','screen','overlay','darken','lighten','color-burn','soft-light'];

const BLANK = () => ({
  type: 'color', color: '#000000', opacity: 0.3,
  blendMode: 'normal', start: 0, end: 10,
  gradientFrom: '#000000', gradientTo: 'transparent', gradientDir: 'to-bottom',
  vignetteSize: 0.5, barHeight: 0.1,
});

export default function ScreenOverlay({ clip }) {
  const { addScreenOverlay, removeScreenOverlay } = useEditorStore();
  const duration = (clip.end_trim || 0) - (clip.start_trim || 0);
  const [draft, setDraft]     = useState(BLANK());
  const [show, setShow]       = useState(false);
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    setDraft(BLANK());
    setShow(false);
  }, [clip.id]);

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const handleAdd = () => {
    addScreenOverlay(clip.id, { ...draft });
    setDraft(BLANK());
    setShow(false);
  };

  const overlays = clip.screen_overlays || [];

  // Build CSS preview for a given overlay
  const previewStyle = (o) => {
    switch (o.type) {
      case 'color':
        return { background: o.color, opacity: o.opacity };
      case 'gradient':
        return {
          background: `linear-gradient(${o.gradientDir === 'to-bottom' ? 'to bottom' : 'to top'},
            ${o.gradientFrom}, ${o.gradientTo})`,
          opacity: o.opacity,
        };
      case 'vignette':
        return {
          background: `radial-gradient(ellipse at center, transparent ${(1 - o.vignetteSize) * 100}%, rgba(0,0,0,0.8) 100%)`,
        };
      case 'bars':
        return { background: 'black', opacity: 1 };
      default:
        return { background: '#555', opacity: o.opacity };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FiLayers size={14} className="text-teal-400" /> Screen Overlays
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(p => !p)}
            className="p-1.5 text-gray-500 hover:text-teal-400 transition-colors"
            title="Toggle previews"
          >
            {preview ? <FiEye size={13} /> : <FiEyeOff size={13} />}
          </button>
          {!show && (
            <button
              onClick={() => setShow(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-700 hover:bg-teal-600
                text-white rounded-lg text-xs font-medium transition-colors"
            >
              <FiPlus size={12} /> Add
            </button>
          )}
        </div>
      </div>

      {/* Existing overlays */}
      {overlays.length > 0 && (
        <div className="space-y-2">
          {overlays.map(o => (
            <div key={o.id}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700
                hover:border-gray-600 rounded-lg p-2.5 transition-colors">

              {/* Mini preview swatch */}
              {preview && (
                <div className="relative flex-shrink-0 w-10 h-7 rounded overflow-hidden bg-gray-700">
                  {o.type === 'bars' ? (
                    <>
                      <div className="absolute top-0 left-0 right-0 bg-black"
                        style={{ height: `${o.barHeight * 100}%` }} />
                      <div className="absolute bottom-0 left-0 right-0 bg-black"
                        style={{ height: `${o.barHeight * 100}%` }} />
                    </>
                  ) : (
                    <div className="absolute inset-0" style={previewStyle(o)} />
                  )}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white">
                  {OVERLAY_TYPES.find(t => t.id === o.type)?.icon}{' '}
                  {OVERLAY_TYPES.find(t => t.id === o.type)?.label}
                </p>
                <p className="text-[10px] text-gray-500 font-mono">
                  {o.start?.toFixed(1)}–{o.end?.toFixed(1)}s
                  {o.opacity != null && ` · ${Math.round(o.opacity * 100)}% opacity`}
                </p>
              </div>

              <button
                onClick={() => removeScreenOverlay(clip.id, o.id)}
                className="p-1 text-gray-600 hover:text-red-400 rounded transition-colors flex-shrink-0"
              >
                <FiTrash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {overlays.length === 0 && !show && (
        <div className="py-6 text-center text-gray-600 text-xs border border-dashed border-gray-800 rounded-lg">
          No overlays yet. Click <strong className="text-gray-500">Add</strong> to layer an effect.
        </div>
      )}

      {/* Add form */}
      {show && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-300">New Screen Overlay</p>

          {/* Type picker */}
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {OVERLAY_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => set('type', t.id)}
                title={t.desc}
                className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs border
                  transition-colors text-left
                  ${draft.type === t.id
                    ? 'bg-teal-700/40 border-teal-600 text-teal-200'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                  }`}
              >
                <span>{t.icon}</span>
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Type-specific options */}
          {(draft.type === 'color' || draft.type === 'blur') && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-wide">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.color} onChange={e => set('color', e.target.value)}
                    className="w-8 h-8 rounded border border-gray-700 bg-gray-800 cursor-pointer" />
                  <span className="text-xs text-gray-500 font-mono">{draft.color}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-wide">
                  Opacity {Math.round(draft.opacity * 100)}%
                </label>
                <input type="range" min={0} max={1} step={0.05} value={draft.opacity}
                  onChange={e => set('opacity', +e.target.value)}
                  className="w-full accent-teal-500" />
              </div>
            </div>
          )}

          {draft.type === 'gradient' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-wide">From</label>
                <input type="color" value={draft.gradientFrom}
                  onChange={e => set('gradientFrom', e.target.value)}
                  className="w-full h-8 rounded border border-gray-700 bg-gray-800 cursor-pointer" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-wide">Direction</label>
                <select value={draft.gradientDir} onChange={e => set('gradientDir', e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg
                    text-xs text-white focus:outline-none">
                  <option value="to-bottom">Top → Bottom</option>
                  <option value="to-top">Bottom → Top</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-wide">
                  Opacity {Math.round(draft.opacity * 100)}%
                </label>
                <input type="range" min={0} max={1} step={0.05} value={draft.opacity}
                  onChange={e => set('opacity', +e.target.value)}
                  className="w-full accent-teal-500" />
              </div>
            </div>
          )}

          {draft.type === 'vignette' && (
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wide">
                Vignette Strength {Math.round(draft.vignetteSize * 100)}%
              </label>
              <input type="range" min={0.1} max={1} step={0.05} value={draft.vignetteSize}
                onChange={e => set('vignetteSize', +e.target.value)}
                className="w-full accent-teal-500" />
            </div>
          )}

          {draft.type === 'bars' && (
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wide">
                Bar Height {Math.round(draft.barHeight * 100)}%
              </label>
              <input type="range" min={0.05} max={0.25} step={0.01} value={draft.barHeight}
                onChange={e => set('barHeight', +e.target.value)}
                className="w-full accent-teal-500" />
            </div>
          )}

          {/* Blend mode */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 uppercase tracking-wide">Blend Mode</label>
            <select value={draft.blendMode} onChange={e => set('blendMode', e.target.value)}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg
                text-xs text-white focus:outline-none focus:border-teal-500">
              {BLEND_MODES.map(m => (
                <option key={m} value={m} className="capitalize">{m}</option>
              ))}
            </select>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wide">Start (s)</label>
              <input type="number" min={0} max={duration} step={0.1} value={draft.start}
                onChange={e => set('start', +e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg
                  text-xs text-white font-mono focus:outline-none focus:border-teal-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wide">End (s)</label>
              <input type="number" min={0} max={duration} step={0.1} value={draft.end}
                onChange={e => set('end', +e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg
                  text-xs text-white font-mono focus:outline-none focus:border-teal-500" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-teal-600
                hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <FiPlus size={13} /> Add Overlay
            </button>
            <button
              onClick={() => setShow(false)}
              className="px-3 py-2 border border-gray-700 hover:border-gray-500
                text-gray-400 hover:text-white rounded-lg text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
