import { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiFolder, FiTrash2, FiFilm, FiClock,
  FiLoader, FiAlertCircle, FiRefreshCw, FiTag,
} from 'react-icons/fi';
import useEditorStore from '../store/editorStore';
import { listProjects, deleteProject, loadProject } from '../api/projects';

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m    = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const CAT_COLORS = {
  Travel: 'from-blue-600 to-cyan-500',
  Sports: 'from-orange-600 to-red-500',
  Nature: 'from-emerald-600 to-green-500',
  Music:  'from-purple-600 to-pink-500',
  Documentary: 'from-yellow-600 to-amber-500',
  News:   'from-gray-600 to-gray-400',
  Comedy: 'from-pink-600 to-rose-500',
  Art:    'from-violet-600 to-indigo-500',
  Education: 'from-teal-600 to-cyan-500',
  General:   'from-blue-600 to-purple-600',
};
const catColor = (cat) => CAT_COLORS[cat] || 'from-blue-600 to-purple-600';

export default function ProjectsPage({ onOpenEditor }) {
  const { setProject, clips, addClip } = useEditorStore();

  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [deleting, setDeleting] = useState(null); // id being deleted
  const [opening,  setOpening]  = useState(null); // id being loaded
  const [confirmDelete, setConfirmDelete] = useState(null); // id pending confirm

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listProjects();
      setProjects(list);
    } catch (e) {
      setError(e.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteProject(id);
      setProjects(p => p.filter(x => x.id !== id));
    } catch (e) {
      setError(`Delete failed: ${e.message}`);
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const handleOpen = async (p) => {
    setOpening(p.id);
    try {
      const { project, clips: savedClips } = await loadProject(p.id);
      setProject(project);
      // Clear current clips and load saved ones
      // (reset via store directly via addClip for each)
      useEditorStore.setState({ clips: [] });
      savedClips.forEach(c => addClip({
        ...c,
        downloadUrl: c.url,
        // Restore edit state
        start_trim:    c.start_trim,
        end_trim:      c.end_trim,
        fade_in:       c.fade_in,
        fade_out:      c.fade_out,
        text_overlays: c.text_overlays || [],
        screen_overlays: [],
      }));
      onOpenEditor();
    } catch (e) {
      setError(`Failed to open project: ${e.message}`);
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Your saved compilation projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProjects}
            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800
              rounded-lg transition-colors"
            title="Refresh"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onOpenEditor}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600
              hover:bg-blue-500 text-white rounded-xl text-sm font-semibold
              transition-colors shadow-sm shadow-blue-900/50"
          >
            <FiPlus size={14} /> New Project
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4
          bg-red-900/30 border border-red-800/50 rounded-xl">
          <FiAlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300 flex-1">{error}</p>
          <button onClick={() => setError(null)}
            className="text-red-500 hover:text-red-300 text-xs">✕</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
          <FiLoader size={20} className="animate-spin" />
          <span className="text-sm">Loading projects…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-900 border border-gray-800
            flex items-center justify-center">
            <FiFolder size={36} className="text-gray-700" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-400">No saved projects</p>
            <p className="text-sm text-gray-600 mt-1">
              Go to the Editor, add clips, and click <strong className="text-gray-400">Save</strong> to create your first project
            </p>
          </div>
          <button
            onClick={onOpenEditor}
            className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500
              text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Open Editor
          </button>
        </div>
      )}

      {/* Project grid */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <div
              key={p.id}
              className="relative bg-gray-900 border border-gray-800 hover:border-gray-600
                rounded-2xl overflow-hidden transition-all group"
            >
              {/* Gradient band */}
              <div className={`h-1.5 bg-gradient-to-r ${catColor(p.category)}`} />

              {/* Thumbnail strip */}
              <div className="relative bg-gray-800 overflow-hidden" style={{ height: 80 }}>
                {p.thumbnail ? (
                  <img
                    src={p.thumbnail}
                    alt=""
                    className="w-full h-full object-cover opacity-60"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiFilm size={28} className="text-gray-700" />
                  </div>
                )}
                {/* Category badge */}
                <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5
                  rounded-full bg-gradient-to-r ${catColor(p.category)} text-white`}>
                  {p.category}
                </span>
              </div>

              <div className="p-4 space-y-3">
                {/* Name & delete */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
                    {p.name}
                  </h3>
                  {confirmDelete === p.id ? (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="text-[10px] px-2 py-1 bg-red-700 hover:bg-red-600
                          text-white rounded transition-colors"
                      >
                        {deleting === p.id ? '…' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[10px] px-2 py-1 border border-gray-700
                          text-gray-400 hover:text-white rounded transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1
                        opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="Delete project"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Description */}
                {p.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>
                )}

                {/* Tags */}
                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map(t => (
                      <span key={t}
                        className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5
                          rounded-full border border-gray-700 flex items-center gap-0.5">
                        <FiTag size={7} /> {t}
                      </span>
                    ))}
                    {p.tags.length > 3 && (
                      <span className="text-[9px] text-gray-600">+{p.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-[10px] text-gray-600">
                  <span className="flex items-center gap-1">
                    <FiFilm size={10} />
                    {p.timeline?.clip_count ?? p.clips?.length ?? 0} clips
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock size={10} />
                    {timeAgo(p.updated_date)}
                  </span>
                </div>

                {/* Open button */}
                <button
                  onClick={() => handleOpen(p)}
                  disabled={opening === p.id}
                  className="w-full flex items-center justify-center gap-2 py-2
                    bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs
                    font-semibold transition-colors
                    disabled:opacity-60 disabled:cursor-wait"
                >
                  {opening === p.id
                    ? <><FiLoader size={12} className="animate-spin" /> Loading…</>
                    : <><FiFilm size={12} /> Open in Editor</>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
