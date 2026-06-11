import { useState } from 'react';
import Timeline from '../components/editor/Timeline';
import TrimEditor from '../components/editor/TrimEditor';
import FadeEditor from '../components/editor/FadeEditor';
import TextOverlay from '../components/editor/TextOverlay';
import ScreenOverlay from '../components/editor/ScreenOverlay';
import SaveModal from '../components/editor/SaveModal';
import ExportModal from '../components/editor/ExportModal';
import useEditorStore from '../store/editorStore';
import { saveProject } from '../api/projects';
import {
  FiScissors, FiSunrise, FiType, FiLayers,
  FiDownload, FiSave, FiFilm, FiSearch, FiInfo,
  FiPlay, FiPause, FiCheckCircle,
} from 'react-icons/fi';

const TABS = [
  { id: 'trim',    label: 'Trim',    icon: <FiScissors size={13} /> },
  { id: 'fade',    label: 'Fades',   icon: <FiSunrise  size={13} /> },
  { id: 'text',    label: 'Text',    icon: <FiType     size={13} /> },
  { id: 'overlay', label: 'Overlay', icon: <FiLayers   size={13} /> },
];

const fmt = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function EditorPage({ onGoToSearch, onGoToProjects }) {
  const { clips, playing, setPlaying, getTotalDuration, project, setProject } = useEditorStore();
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [activeTab, setActiveTab]           = useState('trim');
  const [saveOpen, setSaveOpen]             = useState(false);
  const [exportOpen, setExportOpen]         = useState(false);
  const [lastSaved, setLastSaved]           = useState(null); // ISO timestamp

  const clip  = selectedClipId ? clips.find(c => c.id === selectedClipId) : null;
  const total = getTotalDuration();

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `${project?.name || 'compilation'}-manifest.json`;
    a.click();
  };

  /* ── Save handler (called by SaveModal) ────────────────── */
  const handleSave = async ({ name, category, description, tags }) => {
    const saved = await saveProject({
      id:          project?.id || null,
      name,
      category,
      description,
      tags,
      clips,
    });
    setProject(saved);
    setLastSaved(new Date().toISOString());
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between
        px-4 py-2.5 bg-gray-900 border-b border-gray-800 gap-3">

        <div className="flex items-center gap-3">
          <span className="text-xl">🎬</span>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-none">
              {project?.name || 'Untitled Project'}
            </p>
            <p className="text-[10px] text-gray-500">
              {project?.category || 'Editor'}
              {lastSaved && (
                <span className="ml-2 text-emerald-500">
                  ✓ Saved {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Playback strip */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
          <button
            onClick={() => setPlaying(!playing)}
            className="text-white hover:text-blue-400 transition-colors"
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? <FiPause size={15} /> : <FiPlay size={15} />}
          </button>
          <span className="text-xs font-mono text-gray-300">
            {clips.length} clip{clips.length !== 1 ? 's' : ''} · {fmt(total)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onGoToSearch && (
            <button onClick={onGoToSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700
                hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition-colors">
              <FiSearch size={13} /> Search
            </button>
          )}
          {onGoToProjects && (
            <button onClick={onGoToProjects}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700
                hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition-colors">
              <FiFilm size={13} /> Projects
            </button>
          )}
          <button
            onClick={() => setExportOpen(true)}
            disabled={clips.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700
              hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed">
            <FiDownload size={13} /> Export
          </button>
          <button
            onClick={() => setSaveOpen(true)}
            disabled={clips.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600
              hover:bg-blue-500 text-white rounded-lg text-xs font-semibold
              transition-colors disabled:opacity-40 disabled:cursor-not-allowed
              shadow-sm shadow-blue-900/50"
          >
            {lastSaved
              ? <><FiCheckCircle size={13} /> Update</>
              : <><FiSave size={13} /> Save</>
            }
          </button>
        </div>
      </header>

      {/* ── Timeline ────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-gray-800" style={{ height: 170 }}>
        <Timeline onClipSelect={(c) => { setSelectedClipId(c.id); setActiveTab('trim'); }} />
      </div>

      {/* ── Main workspace ──────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-[260px_1fr] overflow-hidden">

        {/* ── Clip list sidebar ──────────────────────────────── */}
        <aside className="flex flex-col border-r border-gray-800 bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Clips ({clips.length})
            </span>
            {clips.length > 0 && (
              <span className="text-[10px] text-gray-600">{fmt(total)} total</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {clips.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4 py-8">
                <FiFilm size={28} className="text-gray-700" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  No clips yet.<br />Search for videos and add them to the timeline.
                </p>
                {onGoToSearch && (
                  <button onClick={onGoToSearch}
                    className="text-xs text-blue-400 hover:text-blue-300 underline">
                    Go to Search →
                  </button>
                )}
              </div>
            ) : (
              clips.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedClipId(c.id); setActiveTab('trim'); }}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left
                    transition-all
                    ${selectedClipId === c.id
                      ? 'bg-blue-600/20 border border-blue-600/50 ring-1 ring-blue-600/20'
                      : 'border border-transparent hover:bg-gray-800 hover:border-gray-700'
                    }`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={c.thumbnail} alt=""
                      className="w-12 h-8 object-cover rounded"
                      onError={e => { e.target.src = 'https://via.placeholder.com/48x32/1f2937/6b7280?text=◼'; }}
                    />
                    {c.fade_in > 0 && (
                      <div className="absolute inset-y-0 left-0 w-2
                        bg-gradient-to-r from-black/60 to-transparent rounded-l pointer-events-none" />
                    )}
                    {c.fade_out > 0 && (
                      <div className="absolute inset-y-0 right-0 w-2
                        bg-gradient-to-l from-black/60 to-transparent rounded-r pointer-events-none" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate leading-snug">{c.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-500 truncate">{c.source}</span>
                      {c.duration && (
                        <span className="text-[10px] text-gray-600">
                          · {fmt(c.end_trim - c.start_trim)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {c.text_overlays?.length > 0 && (
                        <span className="text-[9px] bg-purple-900/60 text-purple-300 px-1 rounded">
                          T×{c.text_overlays.length}
                        </span>
                      )}
                      {c.screen_overlays?.length > 0 && (
                        <span className="text-[9px] bg-teal-900/60 text-teal-300 px-1 rounded">
                          L×{c.screen_overlays.length}
                        </span>
                      )}
                      {(c.fade_in > 0 || c.fade_out > 0) && (
                        <span className="text-[9px] bg-yellow-900/60 text-yellow-300 px-1 rounded">
                          fade
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-gray-700 font-mono flex-shrink-0">
                    #{i + 1}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── Edit panel ──────────────────────────────────────── */}
        <main className="flex flex-col overflow-hidden bg-gray-950">
          {!clip ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
              <FiInfo size={32} className="text-gray-700" />
              <div>
                <p className="text-sm text-gray-500 font-medium">No clip selected</p>
                <p className="text-xs text-gray-600 mt-1">
                  Click a clip in the sidebar or timeline to edit it
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">

              {/* Clip info bar */}
              <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3
                bg-gray-900 border-b border-gray-800">
                <div className="relative">
                  <img src={clip.thumbnail} alt=""
                    className="w-16 h-10 object-cover rounded-lg border border-gray-700"
                    onError={e => { e.target.src = 'https://via.placeholder.com/64x40/1f2937/6b7280?text=◼'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{clip.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{clip.source}</span>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-gray-500">
                      {fmt(clip.end_trim - clip.start_trim)} selected
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-gray-600">{clip.duration}s original</span>
                  </div>
                </div>
                <a
                  href={clip.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800
                    hover:bg-gray-700 border border-gray-700 rounded-lg text-xs
                    text-gray-300 transition-colors flex-shrink-0"
                >
                  <FiPlay size={11} /> Preview
                </a>
              </div>

              {/* Tab bar */}
              <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2
                bg-gray-900 border-b border-gray-800">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                      font-medium transition-all
                      ${activeTab === t.id
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-900'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'trim'    && <TrimEditor    clip={clip} />}
                {activeTab === 'fade'    && <FadeEditor    clip={clip} />}
                {activeTab === 'text'    && <TextOverlay   clip={clip} />}
                {activeTab === 'overlay' && <ScreenOverlay clip={clip} />}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Export modal ──────────────────────────────────────── */}
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        clips={clips}
        project={project}
      />

      {/* ── Save modal ───────────────────────────────────────── */}
      <SaveModal
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={handleSave}
        project={project}
        clipCount={clips.length}
      />
    </div>
  );
}
