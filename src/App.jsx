import { useState } from 'react';
import SearchPage   from './pages/SearchPage';
import EditorPage   from './pages/EditorPage';
import ProjectsPage from './pages/ProjectsPage';
import { FiSearch, FiFilm, FiFolder } from 'react-icons/fi';
import useEditorStore from './store/editorStore';

const PAGES = [
  { id: 'search',   label: 'Search',   icon: <FiSearch size={14} /> },
  { id: 'editor',   label: 'Editor',   icon: <FiFilm   size={14} /> },
  { id: 'projects', label: 'Projects', icon: <FiFolder size={14} /> },
];

export default function App() {
  const [page, setPage] = useState('search');
  const { clips, project } = useEditorStore();

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">

      {/* ── Top nav ─────────────────────────────────────────── */}
      <nav className="flex-shrink-0 flex items-center gap-1
        px-4 bg-gray-900/90 backdrop-blur border-b border-gray-800 h-11 z-50">

        {/* Logo */}
        <span className="text-lg mr-3">🎬</span>
        <span className="text-sm font-bold text-white mr-4 hidden sm:block">CompileStudio</span>

        {/* Nav buttons */}
        {PAGES.map(p => (
          <button
            key={p.id}
            onClick={() => setPage(p.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
              font-medium transition-colors relative
              ${page === p.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
          >
            {p.icon}
            {p.label}
            {p.id === 'editor' && clips.length > 0 && (
              <span className="ml-0.5 bg-blue-500 text-white text-[9px]
                w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {clips.length}
              </span>
            )}
          </button>
        ))}

        {/* Active project name */}
        {project && (
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500 hidden sm:flex">
            <span className="text-gray-700">·</span>
            <span className="truncate max-w-[160px]" title={project.name}>{project.name}</span>
          </div>
        )}
      </nav>

      {/* ── Page content ────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {page === 'search' && (
          <SearchPage onGoToEditor={() => setPage('editor')} />
        )}
        {page === 'editor' && (
          <EditorPage
            onGoToSearch={()   => setPage('search')}
            onGoToProjects={() => setPage('projects')}
          />
        )}
        {page === 'projects' && (
          <ProjectsPage onOpenEditor={() => setPage('editor')} />
        )}
      </div>
    </div>
  );
}
