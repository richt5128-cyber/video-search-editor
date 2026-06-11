import { useState } from 'react';
import useEditorStore from '../../store/editorStore';

export default function FadeEditor({ clip }) {
  const { setFadeIn, setFadeOut } = useEditorStore();
  const [fadeIn,  setFI] = useState(clip.fade_in  || 0);
  const [fadeOut, setFO] = useState(clip.fade_out || 0);
  const maxFade = Math.min((clip.end_trim - clip.start_trim) / 2, 5);

  return (
    <div className="p-4 bg-gray-900 rounded-xl space-y-4">
      <h3 className="text-sm font-semibold text-white">🌅 Fade Controls</h3>

      {/* Visual fade preview */}
      <div className="relative h-6 rounded overflow-hidden flex">
        <div className="flex-1 relative bg-blue-600">
          {fadeIn > 0 && (
            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-black to-transparent"
              style={{ width: `${Math.min((fadeIn / (clip.end_trim - clip.start_trim)) * 100, 50)}%` }} />
          )}
          {fadeOut > 0 && (
            <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-black to-transparent"
              style={{ width: `${Math.min((fadeOut / (clip.end_trim - clip.start_trim)) * 100, 50)}%` }} />
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Fade In */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Fade In</span>
            <span className="text-blue-400">{fadeIn.toFixed(1)}s</span>
          </div>
          <input type="range" min={0} max={maxFade} step={0.1} value={fadeIn}
            onChange={e => setFI(+e.target.value)}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
            <span>None</span><span>{maxFade.toFixed(1)}s max</span>
          </div>
        </div>

        {/* Fade Out */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Fade Out</span>
            <span className="text-blue-400">{fadeOut.toFixed(1)}s</span>
          </div>
          <input type="range" min={0} max={maxFade} step={0.1} value={fadeOut}
            onChange={e => setFO(+e.target.value)}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
            <span>None</span><span>{maxFade.toFixed(1)}s max</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setFadeIn(clip.id, fadeIn); setFadeOut(clip.id, fadeOut); }}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
          Apply Fades
        </button>
        <button onClick={() => { setFI(0); setFO(0); setFadeIn(clip.id, 0); setFadeOut(clip.id, 0); }}
          className="px-3 py-2 border border-gray-600 text-gray-400 hover:text-white rounded-lg text-sm">
          Reset
        </button>
      </div>
    </div>
  );
}
