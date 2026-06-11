import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useEditorStore from '../../store/editorStore';
import ClipCard from './ClipCard';
import {
  FiScissors, FiCopy, FiClipboard, FiTrash2,
  FiLayers, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function Timeline({ onClipSelect }) {
  const {
    clips, selected,
    reorderClips, removeSelected,
    cutClip, copyClip, pasteClip,
    clearSelection, clipboard,
  } = useEditorStore();

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const ordered = Array.from(clips);
    const [moved] = ordered.splice(result.source.index, 1);
    ordered.splice(result.destination.index, 0, moved);
    reorderClips(ordered);
  };

  const totalDuration = clips.reduce((s, c) => s + ((c.end_trim || 0) - (c.start_trim || 0)), 0);
  const hasSelection  = selected.length > 0;

  return (
    <div className="flex flex-col h-full bg-gray-900">

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-800 flex-shrink-0">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1">
          Timeline
        </span>
        <span className="text-[10px] text-gray-600">
          {clips.length} clip{clips.length !== 1 ? 's' : ''} · {fmt(totalDuration)}
        </span>

        <div className="ml-auto flex items-center gap-0.5">
          {hasSelection && (
            <>
              <ToolBtn icon={<FiScissors size={12} />} label="Cut"    onClick={() => selected.forEach(id => cutClip(id))} />
              <ToolBtn icon={<FiCopy     size={12} />} label="Copy"   onClick={() => copyClip(selected[0])} />
              <Divider />
              <ToolBtn icon={<FiTrash2  size={12} />} label="Delete"  onClick={removeSelected} danger />
              <Divider />
            </>
          )}
          <ToolBtn
            icon={<FiClipboard size={12} />}
            label="Paste"
            onClick={() => pasteClip(selected[0] || clips[clips.length - 1]?.id)}
            disabled={!clipboard}
          />
          {hasSelection && (
            <ToolBtn icon={<FiLayers size={12} />} label="Deselect" onClick={clearSelection} />
          )}
        </div>

        {hasSelection && (
          <span className="ml-2 text-[10px] text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full">
            {selected.length} selected
          </span>
        )}
      </div>

      {/* Track */}
      {clips.length === 0 ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-gray-600 text-xs">
          <FiChevronLeft size={14} />
          Search for videos and click <strong className="text-gray-500 mx-1">+ Add</strong> to start
          <FiChevronRight size={14} />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="timeline" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-2 px-3 py-2 overflow-x-auto flex-1 items-start
                  scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
              >
                {clips.map((clip, index) => (
                  <Draggable key={clip.id} draggableId={clip.id} index={index}>
                    {(prov, snapshot) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        style={prov.draggableProps.style}
                        className={`transition-opacity ${snapshot.isDragging ? 'opacity-80' : ''}`}
                      >
                        <ClipCard
                          clip={clip}
                          index={index}
                          isDragging={snapshot.isDragging}
                          isSelected={selected.includes(clip.id)}
                          onSelect={onClipSelect}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}

function ToolBtn({ icon, label, onClick, danger, disabled }) {
  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs
        transition-colors disabled:opacity-30 disabled:cursor-not-allowed
        ${danger
          ? 'text-red-400 hover:bg-red-900/40 hover:text-red-300'
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-gray-700 mx-0.5" />;
}
