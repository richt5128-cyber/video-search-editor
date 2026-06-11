import useEditorStore from '../../store/editorStore';
import { FiScissors, FiCopy, FiTrash2, FiEdit2 } from 'react-icons/fi';
import clsx from 'clsx';

export default function ClipCard({ clip, index, isDragging, isSelected, onSelect }) {
  const { removeClip, cutClip, copyClip, selectClip } = useEditorStore();
  const duration = (clip.end_trim || 0) - (clip.start_trim || 0);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div
      onClick={(e) => { selectClip(clip.id, e.shiftKey); onSelect?.(clip); }}
      className={clsx(
        'relative w-28 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all select-none group',
        isSelected ? 'border-blue-500 shadow-lg shadow-blue-900/40' : 'border-transparent hover:border-gray-600',
        isDragging && 'opacity-70 rotate-1 scale-105'
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-16 bg-gray-800">
        {clip.thumbnail
          ? <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
        }
        {/* Fade indicators */}
        {clip.fade_in > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/70 to-transparent" title={`Fade in: ${clip.fade_in}s`} />
        )}
        {clip.fade_out > 0 && (
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/70 to-transparent" title={`Fade out: ${clip.fade_out}s`} />
        )}
        {/* Text overlay badge */}
        {clip.text_overlays?.length > 0 && (
          <span className="absolute top-1 right-1 bg-yellow-500 text-black text-[9px] px-1 rounded font-bold">T</span>
        )}
        {/* Order badge */}
        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">{index + 1}</span>
        {/* Duration badge */}
        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded">{fmt(duration)}</span>
      </div>

      {/* Label */}
      <div className="bg-gray-900 px-1.5 py-1">
        <p className="text-[10px] text-gray-300 truncate">{clip.title}</p>
        <p className="text-[9px] text-gray-600">{clip.source}</p>
      </div>

      {/* Hover actions */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
        <ActionBtn icon={<FiEdit2 />} title="Edit" onClick={(e) => { e.stopPropagation(); onSelect?.(clip); }} />
        <ActionBtn icon={<FiScissors />} title="Cut" onClick={(e) => { e.stopPropagation(); cutClip(clip.id); }} />
        <ActionBtn icon={<FiCopy />} title="Copy" onClick={(e) => { e.stopPropagation(); copyClip(clip.id); }} />
        <ActionBtn icon={<FiTrash2 />} title="Remove" danger onClick={(e) => { e.stopPropagation(); removeClip(clip.id); }} />
      </div>
    </div>
  );
}

function ActionBtn({ icon, title, onClick, danger }) {
  return (
    <button onClick={onClick} title={title}
      className={clsx(
        'p-1 rounded-md text-sm',
        danger ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
      )}
    >
      {icon}
    </button>
  );
}
