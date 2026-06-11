import { useState } from 'react';
import Timeline from '../components/editor/Timeline';
import TrimEditor from '../components/editor/TrimEditor';
import FadeEditor from '../components/editor/FadeEditor';
import TextOverlay from '../components/editor/TextOverlay';
import ScreenOverlay from '../components/editor/ScreenOverlay';
import useEditorStore from '../store/editorStore';
import { FiScissors, FiSunrise, FiType, FiLayers, FiDownload, FiSave } from 'react-icons/fi';

const TABS = [
  { id: 'trim',    label: 'Trim',    icon: <FiScissors /> },
  { id: 'fade',    label: 'Fades',   icon: <FiSunrise /> },
  { id: 'text',    label: 'Text',    icon: <FiType /> },
  { id: 'overlay', label: 'Overlay', icon: <FiLayers /> },
];

export default function EditorPage() {
  const { clips } = useEditorStore();
  const [selectedClip, setSelectedClip] = useState(null);
  const [activeTab, setActiveTab] = useState('trim');

  const clip = selectedClip ? clips.find(c => c.id === selectedClip.id) : null;

  const exportManifest = () => {
    const manifest = {
      version: '1.0',
      exported: new Date().toISOString(),
      clips: clips.map(c => ({
        title: c.title, url: c.url, source: c.source,
        start_trim: c.start_trim, end_trim: c.end_trim,
        fade_in: c.fade_in, fade_out: c.fade_out,
        text_overlays: c.text_overlays, screen_overlays: c.screen_overlays,
        order: c.order,
      }))
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'compilation-manifest.json'; a.click();
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-lg">🎬 Compilation Editor</h1>
        <div className="flex gap-2">
          <button onClick={exportManifest}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm">
            <FiDownload /> Export Manifest
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm">
            <FiSave /> Save Project
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-shrink-0" style={{ height: '160px' }}>
        <Timeline onClipSelect={(clip) => setSelectedClip(clip)} />
      </div>

      {/* Edit panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clip list */}
        <div className="lg:col-span-1 space-y-2 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase px-1">Clips ({clips.length})</p>
          {clips.length === 0 && (
            <p className="text-xs text-gray-600 px-1">No clips yet. Search and add videos.</p>
          )}
          {clips.map(c => (
            <button key={c.id} onClick={() => setSelectedClip(c)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
                ${selectedClip?.id === c.id ? 'bg-blue-900/40 border border-blue-700' : 'bg-gray-900 border border-gray-800 hover:border-gray-600'}`}
            >
              <img src={c.thumbnail} alt="" className="w-10 h-7 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{c.title}</p>
                <p className="text-[10px] text-gray-500">{c.source}</p>
              </div>
              <span className="text-[10px] text-gray-600">#{c.order + 1}</span>
            </button>
          ))}
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2">
          {!clip ? (
            <div className="h-full flex items-center justify-center text-gray-600 text-sm">
              Select a clip from the timeline or list to edit it
            </div>
          ) : (
            <div className="space-y-3">
              {/* Clip info */}
              <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-xl">
                <img src={clip.thumbnail} alt="" className="w-16 h-10 object-cover rounded" />
                <div>
                  <p className="text-sm font-medium text-white">{clip.title}</p>
                  <p className="text-xs text-gray-500">{clip.source} · {clip.duration}s total</p>
                </div>
              </div>

              {/* Edit tabs */}
              <div className="flex gap-1 bg-gray-900 p-1 rounded-xl">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'trim'    && <TrimEditor    clip={clip} />}
              {activeTab === 'fade'    && <FadeEditor    clip={clip} />}
              {activeTab === 'text'    && <TextOverlay   clip={clip} />}
              {activeTab === 'overlay' && <ScreenOverlay clip={clip} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
