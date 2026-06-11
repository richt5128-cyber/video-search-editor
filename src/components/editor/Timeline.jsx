import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useEditorStore from '../../store/editorStore';
import ClipCard from './ClipCard';
import { FiScissors, FiCopy, FiClipboard, FiTrash2, FiLayers } from 'react-icons/fi';

export default function Timeline({ onClipSelect }) {
  const { clips, selected, reorderClips, removeSelected, cutClip, copyClip, pasteClip, selectRange, clearSelection } = useEditorStore();

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const ordered = Array.from(clips);
    const [moved] = ordered.splice(result.source.index, 1);
    ordered.splice(result.destination.index, 0, moved);
    reorderClips(ordered);
  };

  const totalDuration = clips.reduce((sum, c) => sum + ((c.end_trim || 0) - (c.start_trim || 0)), 0);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="flex flex-col h-full bg-gray-950 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-900 border-b border-gray-800">
        <span className="text-xs text-gray-400 font-medium mr-2">TIMELINE</span>
        <span className="text-xs text-gray-500">{clips.length} clips · {fmt(totalDuration)}</span>
        <div className="ml-auto flex gap-1">
          {selected.length > 0 && (
            <>
              <ToolBtn icon={<FiScissors />} title="Cut" onClick={() => selected.forEach(id => cutClip(id))} />
              <ToolBtn icon={<FiCopy />} title="Copy" onClick={() => copyClip(selected[0])} />
              <ToolBtn icon={<FiTrash2 />} title="Remove selected" onClick={removeSelected} danger />
            </>
          )}
          <ToolBtn icon={<FiClipboard />} title="Paste" onClick={() => pasteClip(selected[0] || clips[clips.length - 1]?.id)} />
          {selected.length > 0 && (
            <ToolBtn icon={<FiLayers />} title="Clear selection" onClick={clearSelection} />
          )}
        </div>
      </div>

      {/* Selection info */}
      {selected.length > 1 && (
        <div className="px-3 py-1 bg-blue-900/30 text-xs text-blue-300 border-b border-blue-900">
          {selected.length} clips selected — hold Shift and click to extend range
        </div>
      )}

      {/* Clip strip */}
      {clips.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
          Search for videos and click <strong className="mx-1 text-gray-400">+ Add to Timeline</strong> to start building
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="timeline" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-2 p-3 overflow-x-auto min-h-[120px] items-start"
              >
                {clips.map((clip, index) => (
                  <Draggable key={clip.id} draggableId={clip.id} index={index}>
                    {(prov, snapshot) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        style={{ ...prov.draggableProps.style }}
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

function ToolBtn({ icon, title, onClick, danger }) {
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded-md text-sm transition-colors
        ${danger
          ? 'text-red-400 hover:bg-red-900/40'
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
      {icon}
    </button>
  );
}
