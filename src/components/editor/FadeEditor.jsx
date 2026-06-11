import { useState, useEffect } from 'react';
import useEditorStore from '../../store/editorStore';
import { FiSunrise, FiSunset, FiRotateCcw } from 'react-icons/fi';

export default function FadeEditor({ clip }) {
  const { setFadeIn, setFadeOut } = useEditorStore();
  const [fadeIn,  setFI] = useState(clip.fade_in  || 0);
  const [fadeOut, setFO] = useState(clip.fade_out || 0);

  useEffect(() => {
    setFI(clip.fade_in  || 0);
    setFO(clip.fade_out || 0);
  }, [clip.id, clip.fade_in, clip.fade_out]);

  const clipLen = (clip.end_trim || 0) - (clip.start_trim || 0);
  const maxFade = Math.max(0.1, Math.min(clipLen / 2, 5));

  const apply = () => {
    setFadeIn(clip.id, fadeIn);
    setFadeOut(clip.id, fadeOut);
  };

  const reset = () => {
    setFI(0); setFO(0);
    setFadeIn(clip.id, 0);
    setFadeOut(clip.id, 0);
  };

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <FiSunrise size={14} className="text-yellow-400" /> Fade Controls
      </h3>

      {/* Visual fade preview */}
      <div className="relative h-14 rounded-xl overflow-hidden bg-gray-800 flex items-center">
        {/* Clip background */}
        <div className="absolute inset-0 bg-blue-600/40" />

        {/* Thumbnail strip */}
        <img
          src={clip.thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          onError={() => {}}
        />

        {/* Fade In gradient */}
        {fadeIn > 0 && (
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-gray-950 to-transparent pointer-events-none"
            style={{ width: `${Math.min((fadeIn / clipLen) * 100, 48)}%` }}
          />
        )}

        {/* Fade Out gradient */}
        {fadeOut > 0 && (
          <div
            className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-gray-950 to-transparent pointer-events-none"
            style={{ width: `${Math.min((fadeOut / clipLen) * 100, 48)}%` }}
          />
        )}

        {/* Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
          <span className="text-[10px] text-white/70 font-mono">
            {fadeIn > 0 ? `▶ ${fadeIn.toFixed(1)}s` : '—'}
          </span>
          <span className="text-[10px] text-white/50 text-center flex-1">
            {clipLen.toFixed(1)}s
          </span>
          <span className="text-[10px] text-white/70 font-mono">
            {fadeOut > 0 ? `${fadeOut.toFixed(1)}s ◀` : '—'}
          </span>
        </div>
      </div>

      {/* Fade In slider */}
      <FadeSlider
        label="Fade In"
        icon={<FiSunrise size={13} className="text-yellow-400" />}
        value={fadeIn}
        max={maxFade}
        onChange={setFI}
        color="blue"
      />

      {/* Fade Out slider */}
      <FadeSlider
        label="Fade Out"
        icon={<FiSunset size={13} className="text-orange-400" />}
        value={fadeOut}
        max={maxFade}
        onChange={setFO}
        color="orange"
      />

      {/* Preset buttons */}
      <div className="space-y-1">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Presets</p>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'None',   fi: 0,   fo: 0   },
            { label: '0.5s',   fi: 0.5, fo: 0.5 },
            { label: '1s',     fi: 1,   fo: 1   },
            { label: '2s',     fi: 2,   fo: 2   },
          ].map(p => (
            <button
              key={p.label}
              onClick={() => { setFI(Math.min(p.fi, maxFade)); setFO(Math.min(p.fo, maxFade)); }}
              className={`py-1.5 rounded-lg text-xs font-medium transition-colors border
                ${fadeIn === p.fi && fadeOut === p.fo
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={apply}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg
            text-sm font-semibold transition-colors shadow-sm shadow-blue-900/50"
        >
          Apply Fades
        </button>
        <button
          onClick={reset}
          title="Clear fades"
          className="px-3 py-2.5 border border-gray-700 hover:border-gray-500
            text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
        >
          <FiRotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

function FadeSlider({ label, icon, value, max, onChange, color }) {
  const accent = color === 'orange' ? 'accent-orange-500' : 'accent-blue-500';
  const valColor = color === 'orange' ? 'text-orange-400' : 'text-blue-400';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs text-gray-300">{label}</span>
        </div>
        <span className={`text-xs font-mono font-semibold ${valColor}`}>
          {value.toFixed(1)}s
        </span>
      </div>
      <div className="relative">
        <input
          type="range" min={0} max={max} step={0.1} value={value}
          onChange={e => onChange(+e.target.value)}
          className={`w-full h-2 rounded-full ${accent} cursor-pointer`}
          style={{ appearance: 'auto' }}
        />
        <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
          <span>None</span>
          <span className="font-mono">{(max / 2).toFixed(1)}s</span>
          <span className="font-mono">{max.toFixed(1)}s max</span>
        </div>
      </div>
    </div>
  );
}
