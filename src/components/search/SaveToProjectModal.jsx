/**
 * SaveToProjectModal.jsx
 *
 * Shown from the search page. Lets the user:
 *  1. Pick an existing project and append the staged clips to it, OR
 *  2. Create a brand-new project with those clips as its first content.
 *
 * Props:
 *   isOpen      boolean
 *   onClose     () => void
 *   clips       array of clip objects to save
 *   onSaved     (project) => void   called after a successful save
 */

import { useState, useEffect } from 'react';
import {
  FiX, FiPlus, FiFolder, FiCheck, FiLoader,
  FiAlertCircle, FiFilm, FiTag, FiChevronRight,
  FiRefreshCw,
} from 'react-icons/fi';
import { listProjects, saveProject, getClipsForProject } from '../../api/projects';

const CATEGORIES = [
  'General','Travel','Sports','Nature','Music',
  'Documentary','News','Comedy','Art','Education','Other',
];

function timeAgo(iso) {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const CAT_COLORS = {
  Travel:'from-blue-600 to-cyan-500', Sports:'from-orange-600 to-red-500',
  Nature:'from-emerald-600 to-green-500', Music:'from-purple-600 to-pink-500',
  General:'from-blue-600 to-purple-600',
};
const catGrad = (c) => CAT_COLORS[c] || 'from-blue-600 to-purple-600';

/* ─────────────────────────────────────────────────────────── */

export default function SaveToProjectModal({ isOpen, onClose, clips, onSaved }) {
  const [tab,       setTab]       = useState('existing'); // 'existing' | 'new'
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  const [saved,     setSaved]     = useState(null);       // project name
  const [selectedId, setSelectedId] = useState(null);
  const [mergeMode, setMergeMode] = useState('append');   // 'append' | 'replace'

  // New project form
  const [name,     setName]     = useState('');
  const [category, setCategory] = useState('General');
  const [desc,     setDesc]     = useState('');
  const [tags,     setTags]     = useState('');

  // Load projects when opened
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSaved(null);
    setSelectedId(null);
    setName('');
    setTags('');
    setDesc('');
    fetchProjects();
  }, [isOpen]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const list = await listProjects();
      setProjects(list);
      // Auto-switch to "new" if no projects yet
      if (list.length === 0) setTab('new');
    } catch (e) {
      setError(e.message || 'Could not load projects');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  /* ── save to existing ─────────────────────────────────── */
  const handleSaveExisting = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const target = projects.find(p => p.id === selectedId);
      let mergedClips = clips;

      if (mergeMode === 'append') {
        // Fetch existing clips and append new ones after them
        const existing = await getClipsForProject(selectedId);
        mergedClips = [
          ...existing,
          ...clips.map((c, i) => ({ ...c, order: existing.length + i })),
        ];
      }

      const saved = await saveProject({
        id:          selectedId,
        name:        target.name,
        category:    target.category,
        description: target.description || '',
        tags:        target.tags || [],
        clips:       mergedClips,
        thumbnail:   target.thumbnail || clips[0]?.thumbnail || '',
      });

      setSaved(target.name);
      setTimeout(() => { onSaved?.(saved); onClose(); setSaved(null); }, 1000);
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  /* ── save to new ──────────────────────────────────────── */
  const handleSaveNew = async () => {
    if (!name.trim()) { setError('Project name is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      const saved = await saveProject({
        id:          null,
        name:        name.trim(),
        category,
        description: desc.trim(),
        tags:        tags.split(',').map(t => t.trim()).filter(Boolean),
        clips,
        thumbnail:   clips[0]?.thumbnail || '',
      });

      setSaved(name.trim());
      setTimeout(() => { onSaved?.(saved); onClose(); setSaved(null); }, 1000);
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => tab === 'existing' ? handleSaveExisting() : handleSaveNew();

  const canSave = tab === 'existing' ? !!selectedId : !!name.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(5px)' }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700
        rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FiFolder size={15} className="text-blue-400" />
            <h2 className="text-sm font-bold text-white">Save to Project</h2>
          </div>
          <button onClick={onClose} disabled={saving}
            className="text-gray-500 hover:text-white p-1 rounded-lg
              hover:bg-gray-800 transition-colors disabled:opacity-30">
            <FiX size={15} />
          </button>
        </div>

        {/* ── Clip summary ──────────────────────────────── */}
        <div className="flex items-center gap-3 mx-5 mt-4 px-3 py-2.5
          bg-gray-800 rounded-xl flex-shrink-0">
          <span className="text-xl">🎬</span>
          <div>
            <p className="text-sm font-semibold text-white">
              {clips.length} clip{clips.length !== 1 ? 's' : ''} staged
            </p>
            <p className="text-[11px] text-gray-500">
              {clips.map(c => c.title).slice(0, 2).join(', ')}
              {clips.length > 2 ? ` +${clips.length - 2} more` : ''}
            </p>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────── */}
        <div className="flex mx-5 mt-4 bg-gray-800 rounded-xl p-1 gap-1 flex-shrink-0">
          {[
            { id: 'existing', label: 'Add to Existing Project', icon: <FiFolder size={12} /> },
            { id: 'new',      label: 'Create New Project',      icon: <FiPlus   size={12} /> },
          ].map(t => (
            <button key={t.id} onClick={() => !saving && setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2
                rounded-lg text-xs font-semibold transition-all
                ${tab === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ───────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── EXISTING PROJECT TAB ────────────────────── */}
          {tab === 'existing' && (
            <>
              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
                  <FiLoader size={16} className="animate-spin" />
                  <span className="text-sm">Loading projects…</span>
                </div>
              )}

              {!loading && projects.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <FiFolder size={28} className="text-gray-700" />
                  <p className="text-sm text-gray-500">No saved projects yet</p>
                  <button onClick={() => setTab('new')}
                    className="text-xs text-blue-400 hover:text-blue-300 underline">
                    Create your first project →
                  </button>
                </div>
              )}

              {!loading && projects.length > 0 && (
                <>
                  {/* Merge mode toggle */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                      How to add clips
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'append',  label: 'Append',  desc: 'Add after existing clips' },
                        { id: 'replace', label: 'Replace', desc: 'Replace all clips in project' },
                      ].map(m => (
                        <button key={m.id} onClick={() => setMergeMode(m.id)}
                          className={`flex flex-col px-3 py-2.5 rounded-xl border text-left transition-all
                            ${mergeMode === m.id
                              ? 'bg-blue-600/20 border-blue-600/50 text-blue-300'
                              : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                            }`}
                        >
                          <span className="text-xs font-semibold">{m.label}</span>
                          <span className="text-[10px] opacity-70 mt-0.5">{m.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Project list */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                        Select Project
                      </p>
                      <button onClick={fetchProjects}
                        className="text-gray-600 hover:text-gray-400 transition-colors">
                        <FiRefreshCw size={11} />
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {projects.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedId(p.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            border text-left transition-all
                            ${selectedId === p.id
                              ? 'bg-blue-600/15 border-blue-600/50 ring-1 ring-blue-600/20'
                              : 'border-gray-800 hover:border-gray-600 bg-gray-800/40'
                            }`}
                        >
                          {/* Color band */}
                          <div className={`w-1 h-10 rounded-full flex-shrink-0
                            bg-gradient-to-b ${catGrad(p.category)}`} />

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-blue-400">{p.category}</span>
                              <span className="text-[10px] text-gray-600">·</span>
                              <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
                                <FiFilm size={9} />
                                {p.timeline?.clip_count ?? p.clips?.length ?? 0} clips
                              </span>
                              <span className="text-[10px] text-gray-600">·</span>
                              <span className="text-[10px] text-gray-600">
                                {timeAgo(p.updated_date)}
                              </span>
                            </div>
                          </div>

                          {selectedId === p.id
                            ? <FiCheck size={14} className="text-blue-400 flex-shrink-0" />
                            : <FiChevronRight size={14} className="text-gray-600 flex-shrink-0" />
                          }
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── NEW PROJECT TAB ───────────────────────────── */}
          {tab === 'new' && (
            <div className="space-y-3.5">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder="e.g. Summer Highlights 2026"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl
                    text-sm text-white placeholder-gray-600
                    focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30
                    transition-colors"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  Category
                </label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl
                    text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  Description <span className="text-gray-600">(optional)</span>
                </label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Short description…"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl
                    text-sm text-white placeholder-gray-600 resize-none
                    focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider
                  flex items-center gap-1">
                  <FiTag size={9} /> Tags
                  <span className="text-gray-600 normal-case font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="nature, aerial, 4k…"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl
                    text-sm text-white placeholder-gray-600
                    focus:outline-none focus:border-blue-500 transition-colors"
                />
                {tags && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                      <span key={t}
                        className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5
                          rounded-full border border-blue-800/50">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Clip preview */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  Clips to save ({clips.length})
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {clips.map((c, i) => (
                    <div key={c.id || i}
                      className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/60 rounded-lg">
                      <img src={c.thumbnail} alt=""
                        className="w-10 h-7 object-cover rounded flex-shrink-0"
                        onError={e => { e.target.style.display='none'; }}
                      />
                      <p className="text-xs text-gray-300 truncate flex-1">{c.title}</p>
                      <span className="text-[10px] text-gray-600 flex-shrink-0">{c.source}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Error ───────────────────────────────────── */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5
              bg-red-900/30 border border-red-800/50 rounded-xl">
              <FiAlertCircle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-300 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-400">
                <FiX size={11} />
              </button>
            </div>
          )}

          {/* ── Success ─────────────────────────────────── */}
          {saved && (
            <div className="flex items-center gap-2 px-3 py-2.5
              bg-emerald-900/30 border border-emerald-800/50 rounded-xl">
              <FiCheck size={13} className="text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-300 font-semibold">
                Saved to "{saved}"!
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving || !canSave || !!saved}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5
              rounded-xl text-sm font-semibold transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              ${saved
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-900/40'
              }`}
          >
            {saved    ? <><FiCheck size={13} /> Saved!</>
           : saving   ? <><FiLoader size={13} className="animate-spin" /> Saving…</>
           : tab === 'existing'
               ? <><FiFolder size={13} /> Save to Project</>
               : <><FiPlus   size={13} /> Create &amp; Save</>
            }
          </button>
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2.5 border border-gray-700 hover:border-gray-500
              text-gray-400 hover:text-white rounded-xl text-sm transition-colors
              disabled:opacity-30">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
