import { useState, useEffect } from 'react';
import { FiPlus, FiFolder, FiTrash2, FiEdit2, FiFilm, FiClock } from 'react-icons/fi';
import useEditorStore from '../store/editorStore';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ProjectsPage({ onOpenEditor }) {
  const { clips, setProject, project } = useEditorStore();

  const [projects, setProjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cs_projects') || '[]'); }
    catch { return []; }
  });
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');
  const [newCat, setNewCat]     = useState('');

  const save = (list) => {
    setProjects(list);
    localStorage.setItem('cs_projects', JSON.stringify(list));
  };

  const createProject = () => {
    if (!newName.trim()) return;
    const p = {
      id: `proj_${Date.now()}`,
      name: newName.trim(),
      category: newCat.trim() || 'General',
      clips: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    save([p, ...projects]);
    setNewName(''); setNewCat(''); setCreating(false);
  };

  const deleteProject = (id) => {
    save(projects.filter(p => p.id !== id));
  };

  const openProject = (p) => {
    setProject(p);
    onOpenEditor();
  };

  const saveCurrentToProject = (pid) => {
    save(projects.map(p => p.id === pid
      ? { ...p, clips, updatedAt: Date.now() }
      : p
    ));
  };

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your compilation projects</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
          <FiPlus /> New Project
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="mb-6 p-5 bg-gray-900 border border-gray-700 rounded-xl space-y-3">
          <h3 className="text-sm font-semibold text-white">New Compilation Project</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Project Name *</label>
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createProject()}
                placeholder="e.g. Summer Highlights 2025"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Category</label>
              <input value={newCat} onChange={e => setNewCat(e.target.value)}
                placeholder="e.g. Travel, Sports, Nature…"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              Create Project
            </button>
            <button onClick={() => { setCreating(false); setNewName(''); setNewCat(''); }}
              className="px-4 py-2 border border-gray-600 text-gray-400 rounded-lg text-sm hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <FiFolder className="text-5xl text-gray-700" />
          <p className="text-lg font-medium text-gray-500">No projects yet</p>
          <p className="text-sm text-gray-600">Create a project to start organizing your compilations</p>
          <button onClick={() => setCreating(true)}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
            <FiPlus className="inline mr-1" /> Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <div key={p.id}
              className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl overflow-hidden transition-all group">
              {/* Header band */}
              <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600" />
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{p.name}</h3>
                    <span className="text-xs text-blue-400">{p.category}</span>
                  </div>
                  <button onClick={() => deleteProject(p.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100">
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><FiFilm /> {p.clips?.length || 0} clips</span>
                  <span className="flex items-center gap-1"><FiClock /> {timeAgo(p.updatedAt)}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => openProject(p)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                    Open in Editor
                  </button>
                  {clips.length > 0 && (
                    <button onClick={() => saveCurrentToProject(p.id)}
                      title="Save current timeline to this project"
                      className="px-3 py-2 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-xs transition-colors">
                      Save ↓
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
