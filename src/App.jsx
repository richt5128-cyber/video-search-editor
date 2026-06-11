import { useState } from 'react';
import SearchPage from './pages/SearchPage';
import EditorPage from './pages/EditorPage';
import ProjectsPage from './pages/ProjectsPage';
import { FiSearch, FiFilm, FiFolder } from 'react-icons/fi';
import useEditorStore from './store/editorStore';

const PAGES = [
  { id: 'search',   label: 'Search',   icon: <FiSearch /> },
  { id: 'editor',   label: 'Editor',   icon: <FiFilm /> },
  { id: 'projects', label: 'Projects', icon: <FiFolder /> },
];

export default function App() {
  const [page, setPage] = useState('search');
  const { clips } = useEditorStore();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur border-b border-gray-800 h-12 flex items-center px-4 gap-1">
        <span className="text-lg mr-3">🎬</span>
        {PAGES.map(p => (
          <button
            key={p.id}
            onClick={() => setPage(p.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative
              ${page === p.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            {p.icon} {p.label}
            {p.id === 'editor' && clips.length > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {clips.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Page content — offset for fixed nav */}
      <div className="pt-12 flex-1">
        {page === 'search'   && <SearchPage   onGoToEditor={() => setPage('editor')} />}
        {page === 'editor'   && <EditorPage   onGoToSearch={() => setPage('search')} />}
        {page === 'projects' && <ProjectsPage onOpenEditor={() => setPage('editor')} />}
      </div>
    </div>
  );
}
