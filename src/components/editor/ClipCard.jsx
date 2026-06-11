import useEditorStore from '../../store/editorStore';
import { FiScissors, FiCopy, FiTrash2, FiMove } from 'react-icons/fi';

const fmt = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function ClipCard({ clip, index, isDragging, isSelected, onSelect }) {
  const { selectClip, removeClip, cutClip, copyClip } = useEditorStore();
  const trimmed = (clip.end_trim || 0) - (clip.start_trim || 0);

  const handleClick = (e) => {
    selectClip(clip.id, e.shiftKey || e.ctrlKey || e.metaKey);
    onSelect?.(clip);
  };

  return (
    <div
      onClick={handleClick}
      title={clip.title}
      className={`
        relative flex flex-col rounded-lg overflow-hidden cursor-pointer
        transition-all duration-150 select-none flex-shrink-0
        w-[110px]
        ${isDragging   ? 'shadow-2xl shadow-black/60 scale-105 rotate-1 z-50' : ''}
        ${isSelected
          ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-900/40'
          : 'ring-1 ring-gray-700 hover:ring-gray-500'
        }
      `}
    >
      {/* Thumbnail */}
      <div className="relative bg-gray-800" style={{ height: 68 }}>
        <img
          src={clip.thumbnail}
          alt=""
          className="w-full h-full object-cover"
          onError={e => { e.target.src = 'https://via.placeholder.com/110x68/1f2937/4b5563?text=◼'; }}
        />

        {/* Duration badge */}
        <span className="absolute bottom-1 right-1 text-[9px] font-mono
          bg-black/70 text-white px-1 py-0.5 rounded">
          {clip.duration ? fmt(trimmed) : '–'}
        </span>

        {/* Index badge */}
        <span className="absolute top-1 left-1 text-[9px] font-bold
          bg-black/70 text-gray-300 w-4 h-4 flex items-center justify-center rounded">
          {index + 1}
        </span>

        {/* Selection overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
        )}

        {/* Fade in overlay */}
        {clip.fade_in > 0 && (
          <div className="absolute inset-y-0 left-0 w-4
            bg-gradient-to-r from-black/70 to-transparent pointer-events-none" />
        )}
        {/* Fade out overlay */}
        {clip.fade_out > 0 && (
          <div className="absolute inset-y-0 right-0 w-4
            bg-gradient-to-l from-black/70 to-transparent pointer-events-none" />
        )}

        {/* Trim bar */}
        {clip.duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div
              className="absolute top-0 bottom-0 bg-blue-500"
              style={{
                left:  `${(clip.start_trim / clip.duration) * 100}%`,
                right: `${((clip.duration - clip.end_trim) / clip.duration) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="bg-gray-900 px-1.5 py-1 flex items-center gap-1">
        <FiMove size={9} className="text-gray-600 flex-shrink-0 cursor-grab" />
        <p className="text-[10px] text-gray-300 truncate flex-1">{clip.title}</p>
      </div>

      {/* Overlay pill indicators */}
      {(clip.text_overlays?.length > 0 || clip.screen_overlays?.length > 0) && (
        <div className="absolute top-1 right-1 flex gap-0.5">
          {clip.text_overlays?.length > 0 && (
            <span className="text-[8px] bg-purple-800/80 text-purple-200 px-1 rounded">
              T
            </span>
          )}
          {clip.screen_overlays?.length > 0 && (
            <span className="text-[8px] bg-teal-800/80 text-teal-200 px-1 rounded">
              L
            </span>
          )}
        </div>
      )}

      {/* Action buttons (hover reveal) */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 pb-1
        opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <ActionBtn icon={<FiScissors size={10} />} title="Cut"    onClick={() => cutClip(clip.id)}    />
        <ActionBtn icon={<FiCopy     size={10} />} title="Copy"   onClick={() => copyClip(clip.id)}   />
        <ActionBtn icon={<FiTrash2   size={10} />} title="Remove" onClick={() => removeClip(clip.id)} danger />
      </div>
    </div>
  );
}

function ActionBtn({ icon, title, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1 rounded transition-colors
        ${danger
          ? 'bg-red-900/70 text-red-300 hover:bg-red-800'
          : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600'
        }`}
    >
      {icon}
    </button>
  );
}
