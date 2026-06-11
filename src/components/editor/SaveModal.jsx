import { useState, useEffect } from 'react';
import { FiSave, FiX, FiCheck, FiLoader, FiAlertCircle, FiTag } from 'react-icons/fi';

const CATEGORIES = [
  'General', 'Travel', 'Sports', 'Nature', 'Music',
  'Documentary', 'News', 'Comedy', 'Art', 'Education', 'Other',
];

export default function SaveModal({ isOpen, onClose, onSave, project, clipCount }) {
  const [name,     setName]     = useState('');
  const [category, setCategory] = useState('General');
  const [desc,     setDesc]     = useState('');
  const [tags,     setTags]     = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [saved,    setSaved]    = useState(false);

  // Pre-fill when editing existing project
  useEffect(() => {
    if (isOpen) {
      setName(project?.name     || '');
      setCategory(project?.category  || 'General');
      setDesc(project?.description || '');
      setTags((project?.tags || []).join(', '));
      setError(null);
      setSaved(false);
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const isNew = !project?.id;

  const handleSave = async () => {
    if (!name.trim()) { setError('Project name is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name:        name.trim(),
        category,
        description: desc.trim(),
        tags:        tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 900);
    } catch (e) {
      setError(e.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FiSave size={16} className="text-blue-400" />
            <h2 className="text-sm font-bold text-white">
              {isNew ? 'Save New Project' : 'Update Project'}
            </h2>
          </div>
          <button onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800">
            <FiX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">

          {/* Clip count badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
            <span className="text-2xl">🎬</span>
            <div>
              <p className="text-sm font-semibold text-white">{clipCount} clip{clipCount !== 1 ? 's' : ''} in timeline</p>
              <p className="text-xs text-gray-500">All edits, trims, fades & overlays will be saved</p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
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
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl
                text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Description <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Short description of this compilation…"
              rows={2}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl
                text-sm text-white placeholder-gray-600 resize-none
                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30
                transition-colors"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <FiTag size={10} /> Tags <span className="text-gray-600">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="nature, aerial, 4k…"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl
                text-sm text-white placeholder-gray-600
                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30
                transition-colors"
            />
            {tags && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                  <span key={t}
                    className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full border border-blue-800/50">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg">
              <FiAlertCircle size={13} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-800">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
              text-sm font-semibold transition-all
              ${saved
                ? 'bg-emerald-600 text-white'
                : saving
                ? 'bg-blue-700 text-white/70 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-900/50'
              }`}
          >
            {saved   ? <><FiCheck size={14} /> Saved!</>
           : saving  ? <><FiLoader size={14} className="animate-spin" /> Saving…</>
           : <><FiSave size={14} /> {isNew ? 'Save Project' : 'Update Project'}</>}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 border border-gray-700 hover:border-gray-500
              text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
